export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Bem-vindo ao sistema de gerenciamento da sua ERP Concessionária.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {/* Metric Cards placeholders */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Veículos Cadastrados</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H8.3a2 2 0 0 0-1.6.8L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 0 4 0a2 2 0 0 0-4 0zM4 16a2 2 0 1 0 4 0a2 2 0 0 0-4 0z"/></svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+4 adicionados este mês</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Clientes Ativos</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">+18% desde o mês passado</p>
          </div>
        </div>
      </div>
    </div>
  )
}
