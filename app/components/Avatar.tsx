import Image from 'next/image';

interface AvatarProps {
  image?: string | null;
  name: string;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Avatar({ image, name, size = 32 }: AvatarProps) {
  const initials = getInitials(name || '?');

  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: '#00A651',
        fontSize: Math.max(10, size * 0.35),
        flexShrink: 0,
      }}
      aria-label={`${name} avatar`}
    >
      {initials}
    </div>
  );
}
