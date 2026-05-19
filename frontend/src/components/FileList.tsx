import { useState } from 'react';
import { Download, Trash2, ExternalLink, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FileMetadata } from '../types';
import {
  deleteFileFromBlockchain,
  getTxUrl,
} from '../lib/blockchain';
import { downloadFromIPFS, getIPFSUrl } from '../lib/ipfs';
import { decryptFile } from '../lib/crypto';
import { formatBytes, formatDate, getFileIcon } from '../lib/utils';
import PasswordDialog from './PasswordDialog';

interface FileListProps {
  files: FileMetadata[];
  searchQuery: string;
  onChanged: () => void;
}

export default function FileList({ files, searchQuery, onChanged }: FileListProps) {
  const [downloadTarget, setDownloadTarget] = useState<FileMetadata | null>(null);
  const [busyCid, setBusyCid] = useState<string | null>(null);

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async (password: string) => {
    if (!downloadTarget) return;
    const file = downloadTarget;
    setDownloadTarget(null);
    setBusyCid(file.cid);

    const toastId = toast.loading('Скачивание из IPFS...');
    try {
      const encrypted = await downloadFromIPFS(file.cid);

      toast.loading('Расшифровка в браузере...', { id: toastId });
      const plaintext = await decryptFile(encrypted, password);

      const blob = new Blob([plaintext], { type: file.fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Файл скачан и расшифрован!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Скачивание не удалось', { id: toastId });
    } finally {
      setBusyCid(null);
    }
  };

  const handleDelete = async (file: FileMetadata) => {
    if (!confirm(`Удалить "${file.name}"? Это удалит запись из блокчейна. Зашифрованный файл в IPFS может оставаться на закэшированных узлах.`)) {
      return;
    }
    setBusyCid(file.cid);
    const toastId = toast.loading('Подтвердите транзакцию в MetaMask...');
    try {
      const hash = await deleteFileFromBlockchain(file.cid);
      toast.success(
        (t) => (
          <span>
            Файл удалён.{' '}
            <a
              href={getTxUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
              onClick={() => toast.dismiss(t.id)}
            >
              Посмотреть транзакцию
            </a>
          </span>
        ),
        { id: toastId, duration: 5000 }
      );
      onChanged();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Удаление не удалось', { id: toastId });
    } finally {
      setBusyCid(null);
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="font-semibold text-zinc-900 mb-1">
          {searchQuery ? 'Ничего не найдено' : 'Пока нет файлов'}
        </h3>
        <p className="text-sm text-zinc-500">
          {searchQuery ? 'Попробуйте другое имя' : 'Загрузите ваш первый зашифрованный файл выше'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((file) => {
          const busy = busyCid === file.cid;
          return (
            <div
              key={file.cid}
              className="group bg-white border border-zinc-100 rounded-2xl p-5 hover:border-zinc-200 hover:shadow-sm transition-all flex flex-col gap-3 animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {getFileIcon(file.fileType || file.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {formatBytes(file.size)} &middot; {formatDate(file.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="text-xs text-zinc-400 font-mono truncate" title={file.cid}>
                CID: {file.cid.slice(0, 12)}...{file.cid.slice(-6)}
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-100">
                <button
                  onClick={() => setDownloadTarget(file)}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Скачать
                </button>
                <a
                  href={getIPFSUrl(file.cid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  title="Открыть зашифрованный файл в IPFS"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(file)}
                  disabled={busy}
                  className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Удалить файл"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <PasswordDialog
        isOpen={!!downloadTarget}
        onClose={() => setDownloadTarget(null)}
        onSubmit={handleDownload}
        title="Введите пароль для расшифровки"
        description={
          downloadTarget
            ? `Расшифровка "${downloadTarget.name}". Введите пароль, который использовали при загрузке.`
            : ''
        }
        submitLabel="Расшифровать и скачать"
      />
    </>
  );
}
