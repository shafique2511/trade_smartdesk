type PageTitleProps = {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageTitle({ actions, description, title }: PageTitleProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold-400">Trading SmartDesk</p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
