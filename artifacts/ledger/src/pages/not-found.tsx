export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
      <h1 className="text-4xl font-mono font-bold text-primary mb-2">404</h1>
      <p className="text-muted-foreground font-mono">Resource not found</p>
    </div>
  )
}