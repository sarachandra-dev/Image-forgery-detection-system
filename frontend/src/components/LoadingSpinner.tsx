export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Analyzing image...</p>
    </div>
  );
}
