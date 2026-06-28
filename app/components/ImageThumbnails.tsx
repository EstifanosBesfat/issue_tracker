interface Props {
  urls: string[];
}

export default function ImageThumbnails({ urls }: Props) {
  if (!urls.length) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Attachment ${i + 1}`}
            className="h-20 w-20 rounded-lg object-cover border border-zinc-200 hover:opacity-80 transition-opacity cursor-pointer"
          />
        </a>
      ))}
    </div>
  );
}
