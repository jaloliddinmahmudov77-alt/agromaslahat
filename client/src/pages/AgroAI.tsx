import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, ImagePlus, MessageSquarePlus, Send, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { fileToDataUrl } from '../lib/image';
import type { ChatMessage } from '../lib/types';
import { useApi, useMeta } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { RichText } from '../components/RichText';
import { AiOffNote, Button, ErrorBox, NeedLogin, PageHeader, Spinner, Textarea, cx } from '../components/ui';

interface ChatItem {
  id: string;
  title: string;
  updatedAt: string;
}

const SUGGESTIONS = ['Paxtani qachon chekanka qilish kerak?', 'Bug‘doydan keyin nima eksam bo‘ladi?', 'Piyozda barglar sarg‘aymoqda, nima qilay?', 'Sho‘rlangan yerni qanday yaxshilash mumkin?'];

function Chat() {
  const meta = useMeta();
  const list = useApi<{ chats: ChatItem[] }>('/ai/chats');
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function open(id: string) {
    setChatId(id);
    setLoadingChat(true);
    setError(null);
    try {
      const r = await api.get<{ chat: { messages: ChatMessage[] } }>(`/ai/chats/${id}`);
      setMessages(r.chat.messages);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingChat(false);
    }
  }

  function newChat() {
    setChatId(null);
    setMessages([]);
    setError(null);
  }

  async function remove(id: string) {
    await api.del(`/ai/chats/${id}`);
    if (id === chatId) newChat();
    list.reload();
  }

  async function send(e?: FormEvent, preset?: string) {
    e?.preventDefault();
    const q = (preset ?? text).trim();
    if (!q || sending) return;
    setSending(true);
    setError(null);
    const pending: ChatMessage = { id: `tmp-${Date.now()}`, role: 'user', content: q, hadImage: Boolean(image), createdAt: new Date().toISOString() };
    setMessages((m) => [...m, pending]);
    setText('');
    try {
      const r = await api.post<{ chatId: string; messages: ChatMessage[] }>('/ai/chat', { chatId: chatId ?? undefined, text: q, image: image ?? undefined });
      setMessages((m) => [...m.filter((x) => x.id !== pending.id), ...r.messages]);
      setImage(null);
      if (!chatId) {
        setChatId(r.chatId);
        list.reload();
      }
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== pending.id));
      setText(q);
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const disabled = meta?.aiEnabled === false;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-line bg-paper p-3">
        <Button variant="secondary" className="mb-3 w-full" onClick={newChat}>
          <MessageSquarePlus className="size-4" /> Yangi suhbat
        </Button>
        <div className="max-h-[50vh] space-y-1 overflow-y-auto lg:max-h-[60vh]">
          {list.data?.chats.map((c) => (
            <div key={c.id} className={cx('group flex items-center rounded-xl', c.id === chatId ? 'bg-forest-100' : 'hover:bg-forest-50')}>
              <button onClick={() => open(c.id)} className="flex-1 truncate px-3 py-2 text-left text-sm">
                {c.title}
              </button>
              <button onClick={() => remove(c.id)} className="p-2 text-muted opacity-60 hover:text-rose-700 group-hover:opacity-100" aria-label="Suhbatni o‘chirish">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {list.data?.chats.length === 0 && <p className="px-3 py-2 text-sm text-muted">Suhbatlar hali yo‘q</p>}
        </div>
      </aside>

      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-line bg-paper">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {disabled && <AiOffNote />}
          {loadingChat && <Spinner />}
          {!loadingChat && messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-forest-100 text-forest-700">
                <Bot className="size-7" />
              </span>
              <p className="font-display text-xl font-semibold">Savolingizni yozing</p>
              <div className="flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} disabled={disabled} onClick={() => send(undefined, s)} className="rounded-full bg-forest-50 px-3 py-1.5 text-sm hover:bg-forest-100 disabled:opacity-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cx('max-w-[85%] rounded-2xl px-4 py-3', m.role === 'user' ? 'bg-forest-900 text-cream' : 'bg-forest-50 text-ink')}>
                {m.hadImage && <p className="mb-1 text-xs opacity-75">📷 rasm biriktirilgan</p>}
                {m.role === 'model' ? <RichText text={m.content} /> : <p className="whitespace-pre-wrap">{m.content}</p>}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex">
              <div className="rounded-2xl bg-forest-50 px-4 py-3 text-muted">AgroAI yozmoqda…</div>
            </div>
          )}
          {error && <ErrorBox message={error} />}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="border-t border-line p-3">
          {image && (
            <div className="mb-2 flex items-center gap-2">
              <img src={image} alt="Biriktirilgan rasm" className="size-14 rounded-lg object-cover" />
              <button type="button" onClick={() => setImage(null)} className="rounded-lg p-1 text-muted hover:text-rose-700" aria-label="Rasmni olib tashlash">
                <X className="size-4" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) setImage(await fileToDataUrl(f).catch(() => null));
              }}
            />
            <button type="button" disabled={disabled} onClick={() => fileRef.current?.click()} className="rounded-xl p-3 text-forest-700 hover:bg-forest-50 disabled:opacity-50" aria-label="Rasm biriktirish">
              <ImagePlus className="size-5" />
            </button>
            <Textarea
              rows={1}
              value={text}
              disabled={disabled}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Masalan: g‘o‘zada o‘rgimchakkana paydo bo‘ldi, nima qilay?"
              className="max-h-40 min-h-12 flex-1"
              maxLength={4000}
            />
            <Button type="submit" disabled={disabled || !text.trim()} loading={sending} className="h-12" aria-label="Yuborish">
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AgroAI() {
  const { user, loading } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="AgroAI" title="Sun’iy intellekt agronom">
        Ekin, tuproq, sug‘orish, o‘g‘itlash va kasalliklar haqida o‘zbek tilida savol bering. Rasm ham biriktirish mumkin.
      </PageHeader>
      {loading ? <Spinner /> : user ? <Chat /> : <NeedLogin what="AgroAI bilan suhbatlashish" />}
    </div>
  );
}
