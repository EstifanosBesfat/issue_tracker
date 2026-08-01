const MENTION_NAME_REGEX = /@([\w.\u1200-\u137F]+(?:\s[\w.\u1200-\u137F]+)*)/g;
const MENTION_EMAIL_REGEX = /@([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/g;

export function extractMentionHandles(content: string): string[] {
  const handles = new Set<string>();

  for (const match of content.matchAll(MENTION_NAME_REGEX)) {
    if (match[1]) handles.add(match[1].trim());
  }

  for (const match of content.matchAll(MENTION_EMAIL_REGEX)) {
    if (match[1]) handles.add(match[1].trim());
  }

  return [...handles];
}

type MentionUser = {
  id: string;
  name: string | null;
  email: string;
};

export function resolveMentionedUserIds(
  handles: string[],
  users: MentionUser[],
  authorId: string
): string[] {
  const mentioned = new Set<string>();

  for (const handle of handles) {
    const normalized = handle.toLowerCase().replace(/\s+/g, '');

    const match = users.find((user) => {
      if (user.id === authorId) return false;

      const email = user.email.toLowerCase();
      const name = user.name?.toLowerCase() ?? '';
      const compactName = name.replace(/\s+/g, '');

      return (
        email === handle.toLowerCase() ||
        name === handle.toLowerCase() ||
        compactName === normalized
      );
    });

    if (match) mentioned.add(match.id);
  }

  return [...mentioned];
}

export function renderMentionContent(content: string) {
  const combined =
    /(@[\w.\u1200-\u137F]+(?:\s[\w.\u1200-\u137F]+)*|@[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/g;
  const parts: Array<{ type: 'text' | 'mention'; value: string }> = [];

  let lastIndex = 0;
  for (const match of content.matchAll(combined)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, index) });
    }
    parts.push({ type: 'mention', value: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text' as const, value: content }];
}
