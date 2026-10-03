export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="text-4xl">🏸</div>
        <h1 className="mt-2 text-2xl font-semibold">Badminton Club</h1>
      </div>
      {children}
    </main>
  );
}
