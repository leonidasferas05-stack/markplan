import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import PlanGenerator from "@/components/PlanGenerator";

export const instant = false;

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-5xl font-bold text-indigo-700">MarkPlan</h1>
          <p className="text-gray-600 text-lg">
            Преврати идею в детальный маркетинг-план за 30 секунд.
            <br />
            Готов к работе в Excel.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-lg w-full">
              Войти через Google
            </button>
          </form>
          <p className="text-xs text-gray-400">
            Бесплатно: 3 плана. Дальше — безлимит по подписке.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-indigo-700">
            MarkPlan
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/plans"
              className="text-sm text-gray-600 hover:text-indigo-600"
            >
              Мои планы
            </Link>
            <span className="text-sm text-gray-600 hidden sm:inline">
              {session.user.email}
            </span>
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button className="text-sm text-gray-500 hover:text-gray-900">
                Выйти
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <PlanGenerator />
      </main>
    </div>
  );
}