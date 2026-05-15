import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      {children}
      <AdminNav />
    </div>
  )
}
