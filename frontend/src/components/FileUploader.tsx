import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { encryptFile } from '../lib/crypto';
import { uploadToIPFS } from '../lib/ipfs';
import { addFileToBlockchain } from '../lib/blockchain';
import { formatBytes } from '../lib/utils';
import PasswordDialog from './PasswordDialog';

interface FileUploaderProps {
  onUploaded: () => void;
}

type Stage = 'idle' | 'encrypting' | 'uploading' | 'recording' | 'done';

const stageLabels: Record<Stage, string> = {
  idle: '',
  encrypting: 'Шифрование локально...',
  uploading: 'Загрузка в IPFS...',
  recording: 'Запись в блокчейн...',
  done: 'Готово!',
};

export default function FileUploader({ onUploaded }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('Файл слишком большой. Максимум 50 МБ.');
        return;
      }
      setSelectedFile(file);
      setShowPasswordDialog(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async (password: string) => {
    if (!selectedFile) return;
    setShowPasswordDialog(false);
    const toastId = toast.loading('Начинаем загрузку...');

    try {
      setStage('encrypting');
      toast.loading('Шифруем файл в браузере...', { id: toastId });
      const encrypted = await encryptFile(selectedFile, password);

      setStage('uploading');
      toast.loading('Загружаем зашифрованный файл в IPFS...', { id: toastId });
      const cid = await uploadToIPFS(encrypted, selectedFile.name + '.enc');

      setStage('recording');
      toast.loading('Подтвердите транзакцию в MetaMask...', { id: toastId });
      await addFileToBlockchain(
        cid,
        selectedFile.name,
        selectedFile.size,
        selectedFile.type || 'application/octet-stream'
      );

      setStage('done');
      toast.success('Файл успешно загружен!', { id: toastId });

      setTimeout(() => {
        setStage('idle');
        setSelectedFile(null);
        onUploaded();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Загрузка не удалась', { id: toastId });
      setStage('idle');
      setSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setShowPasswordDialog(false);
    setSelectedFile(null);
  };

  const isUploading = stage !== 'idle';

  return (
    <>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer ${
          isDragActive
            ? 'border-brand-500 bg-brand-50'
            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
        } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center text-center">
            {stage === 'done' ? (
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <Check className="w-6 h-6" />
              </div>
            ) : (
              <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-3" />
            )}
            <p className="font-semibold text-zinc-900">{stageLabels[stage]}</p>
            {selectedFile && (
              <p className="text-sm text-zinc-500 mt-1">
                {selectedFile.name} &middot; {formatBytes(selectedFile.size)}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-zinc-100 text-zinc-600 rounded-full flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-semibold text-zinc-900 mb-1">
              {isDragActive ? 'Отпустите файл здесь' : 'Перетащите файл или нажмите для выбора'}
            </p>
            <p className="text-sm text-zinc-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Сквозное шифрование &middot; До 50 МБ
            </p>
          </div>
        )}
      </div>

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={handleCancel}
        onSubmit={handleUpload}
        title="Задайте пароль шифрования"
        description={
          selectedFile
            ? `Шифрование файла "${selectedFile.name}". Выберите пароль для защиты файла.`
            : 'Выберите пароль для шифрования файла.'
        }
        submitLabel="Зашифровать и загрузить"
        requireConfirm={true}
      />
    </>
  );
}
