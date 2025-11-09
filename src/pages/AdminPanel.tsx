import React, { useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

const AdminPanel: React.FC = () => {
  const { users, approveUser, rejectUser, currentUser, loading } = useAuth()
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const { pending, approved, rejected } = useMemo(() => {
    const withoutSelf = users.filter((user) => user.id !== currentUser?.id)
    return {
      pending: withoutSelf.filter((user) => user.status === 'pending'),
      approved: withoutSelf.filter((user) => user.status === 'approved'),
      rejected: withoutSelf.filter((user) => user.status === 'rejected')
    }
  }, [users, currentUser])

  const handleApprove = async (userId: string) => {
    setUpdatingUserId(userId)
    await approveUser(userId)
    setUpdatingUserId(null)
  }

  const handleReject = async (userId: string) => {
    setUpdatingUserId(userId)
    await rejectUser(userId)
    setUpdatingUserId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-10 fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text-gold">Admin panel</h1>
        <p className="text-f1-text-secondary max-w-3xl">
          Kezeld a regisztrációs kérelmeket és tartsd karban a pilóta fiókokat. Csak az elfogadott
          felhasználók tudnak bejelentkezni.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="space-y-2">
          <p className="text-sm text-f1-text-secondary uppercase tracking-wide">Folyamatban</p>
          <p className="text-3xl font-bold text-f1-text">{pending.length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-f1-text-secondary uppercase tracking-wide">Jóváhagyott</p>
          <p className="text-3xl font-bold text-emerald-400">{approved.length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-f1-text-secondary uppercase tracking-wide">Elutasított</p>
          <p className="text-3xl font-bold text-f1-red">{rejected.length}</p>
        </Card>
      </section>

      <Card className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-f1-text">Jóváhagyásra váró felhasználók</h2>
            <p className="text-sm text-f1-text-secondary">
              Fogadd el vagy utasítsd el a kérelmeket. Az elutasított felhasználók nem tudnak
              bejelentkezni.
            </p>
          </div>
        </header>

        {pending.length === 0 ? (
          <div className="text-center py-10 text-f1-text-secondary">
            Jelenleg nincs új regisztráció.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-f1-light-gray/40 bg-f1-dark/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="text-lg font-semibold text-f1-text">{user.name}</p>
                  <p className="text-sm text-f1-text-secondary">{user.email}</p>
                  <p className="text-xs text-f1-text-secondary mt-1">
                    Regisztrált: {new Date(user.createdAt).toLocaleString('hu-HU')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="gold"
                    onClick={() => handleApprove(user.id)}
                    disabled={updatingUserId === user.id}
                  >
                    {updatingUserId === user.id ? 'Folyamatban...' : 'Jóváhagyás'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(user.id)}
                    disabled={updatingUserId === user.id}
                  >
                    Elutasítás
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-f1-text">Jóváhagyott felhasználók</h2>
          {approved.length === 0 ? (
            <p className="text-sm text-f1-text-secondary">Még senki sem lett jóváhagyva.</p>
          ) : (
            <ul className="space-y-2 text-sm text-f1-text-secondary">
              {approved.map((user) => (
                <li key={user.id} className="flex items-center justify-between">
                  <span className="text-f1-text">{user.name}</span>
                  <span>{user.email}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-f1-text">Elutasított felhasználók</h2>
          {rejected.length === 0 ? (
            <p className="text-sm text-f1-text-secondary">Nincs elutasított felhasználó.</p>
          ) : (
            <ul className="space-y-2 text-sm text-f1-text-secondary">
              {rejected.map((user) => (
                <li key={user.id} className="flex items-center justify-between">
                  <span className="text-f1-text">{user.name}</span>
                  <span>{user.email}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  )
}

export default AdminPanel
