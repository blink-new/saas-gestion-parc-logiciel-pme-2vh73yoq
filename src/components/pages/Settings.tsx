import { User } from '../../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Settings as SettingsIcon } from 'lucide-react'

interface SettingsProps {
  user: User
}

export function Settings({ user }: SettingsProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre compte et les paramètres de l'entreprise
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Configuration
          </CardTitle>
          <CardDescription>
            Fonctionnalité en cours de développement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <SettingsIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Cette page sera bientôt disponible</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}