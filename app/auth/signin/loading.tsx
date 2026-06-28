export default function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col items-center gap-6 animate-pulse">
        {/* Logo skeleton */}
        <div className="h-12 w-44 rounded-md bg-gray-200" />

        {/* Heading skeleton */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="h-5 w-56 rounded bg-gray-200" />
          <div className="h-5 w-36 rounded bg-gray-200" />
        </div>

        {/* Button skeleton */}
        <div className="h-11 w-full rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}
