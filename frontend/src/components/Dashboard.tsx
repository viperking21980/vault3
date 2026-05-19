import { useState, useEffect, useCallback } from 'react';
import { Shield, LogOut, Copy, Check, Search, HardDrive, FileText, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FileMetadata } from '../types';
import { getUserFiles, getAddressUrl } from '../lib/blockchain';
import { formatBytes, shortenAddress } from '../lib/utils';
import FileUploader from './FileUploader';
import FileList from './FileList';

interface DashboardProps {
  address: string;
  onDisconnect: () => void;
}

export default function Dashboard({ address, onDisconnect }: DashboardProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const userFiles = await getUserFiles(address);
      setFiles(userFiles);
    } catch (err: any) {
      console.error(err);
      toast.error('Не удалось загрузить файлы: ' + (err.message || 'неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const totalSize = files.reduce(
    (sum, f) => sum + (typeof f.size === 'bigint' ? Number(f.size) : f.size),
    0
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">Vault3</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAddress}
              className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-medium font-mono transition-colors"
              title="Скопировать адрес"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{shortenAddress(address)}</span>
                </>
              )}
            </button>
            <a
              href={getAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Открыть в Polygonscan"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onDisconnect}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Отключить"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Файлов"
            value={files.length.toString()}
          />
          <StatCard
            icon={<HardDrive className="w-5 h-5" />}
            label="Общий объём"
            value={formatBytes(totalSize)}
          />
        </div>

        <div className="mb-8">
          <FileUploader onUploaded={loadFiles} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Ваши файлы</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени..."
              className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-zinc-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-sm text-zinc-500 mt-3">Загрузка файлов из блокчейна...</p>
          </div>
        ) : (
          <FileList
            files={files}
            searchQuery={searchQuery}
            onChanged={loadFiles}
          />
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-zinc-500 mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
