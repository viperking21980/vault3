import { Shield, Lock, Globe, Zap, ArrowRight } from 'lucide-react';

interface LandingProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export default function Landing({ onConnect, isConnecting }: LandingProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">Vault3</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
          >
            GitHub
          </a>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
          На базе Ethereum и IPFS
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-zinc-900 mb-6 animate-fade-in">
          Ваши файлы.<br />
          <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
            Ваши ключи. Ваш контроль.
          </span>
        </h1>

        <p className="text-xl text-zinc-600 max-w-2xl mx-auto mb-12 animate-fade-in">
          Децентрализованное хранилище со сквозным шифрованием.
          Никаких серверов, никакой слежки, никакой единой точки отказа.
        </p>

        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-semibold rounded-xl text-lg transition-all hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed animate-fade-in"
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Подключение...
            </>
          ) : (
            <>
              Подключить кошелёк
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-sm text-zinc-400 mt-4">
          Требуется MetaMask. Бесплатно. Без регистрации.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Lock className="w-6 h-6" />}
            title="Сквозное шифрование"
            description="Файлы шифруются в вашем браузере алгоритмом AES-256 до отправки. Ключ знаете только вы."
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6" />}
            title="Настоящая децентрализация"
            description="Хранение в распределённой сети IPFS с записью метаданных в смарт-контракт на блокчейне."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Без посредников"
            description="Ни один провайдер не может прочитать, заблокировать или удалить ваши файлы. Вы владеете данными."
          />
        </div>
      </section>

      <section className="bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold text-center mb-16">Как это работает</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Step number="01" title="Подключите кошелёк" description="Аутентификация через MetaMask. Без паролей." />
            <Step number="02" title="Шифрование локально" description="Файл шифруется в браузере вашим паролем." />
            <Step number="03" title="Загрузка в IPFS" description="Зашифрованные байты отправляются в сеть IPFS." />
            <Step number="04" title="Запись в блокчейн" description="Метаданные сохраняются в смарт-контракте." />
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>Vault3. Открытый исходный код, лицензия MIT.</p>
          <p>Тестовая сеть Polygon Amoy</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
      <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="text-sm font-mono text-brand-600 mb-3">{number}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
    </div>
  );
}
