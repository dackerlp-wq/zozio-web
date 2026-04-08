import Link from 'next/link'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-warm flex items-center justify-center px-4">
      <div className="w-full max-w-[480px] text-center">

        <div className="mb-6">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-pale p-10">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-display font-extrabold text-3xl text-espresso mb-3">
            Registrace odeslána!
          </h1>
          <p className="text-base text-brown-mid leading-relaxed mb-6">
            Tvoje instituce byla zaregistrována a čeká na schválení.
            Zkontroluj svůj e-mail — pošleme ti potvrzení a informaci o schválení do 24 hodin.
          </p>

          <div className="bg-amber-light rounded-md p-4 mb-6 text-left">
            <div className="font-display font-bold text-sm text-espresso mb-2">Co se stane dál?</div>
            <ul className="space-y-1.5 text-sm text-brown-mid">
              <li>✉️ Dostaneš potvrzovací e-mail</li>
              <li>🔍 Tým Zozio zkontroluje údaje</li>
              <li>✓ Po schválení se přihlásíš do admin panelu</li>
              <li>🐾 Můžeš začít přidávat zvířata!</li>
            </ul>
          </div>

          <Link href="/">
            <Button variant="primary" className="w-full justify-center">
              Zpět na hlavní stránku
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
