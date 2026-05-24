export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  }[size];

  return (
    <div
      className={`${cls} rounded-full border-zinc-700 border-t-violet-500 animate-spin`}
    />
  );
}
