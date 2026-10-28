import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Minus, Link2, ImagePlus, Undo2, Redo2, Loader2, Check, X,
} from "lucide-react";

// Editor visual do blog (sem markdown): salva HTML no campo corpo do artigo.
export default function EditorTexto({ valor, onChange, enviarImagem }) {
  const [link, setLink] = useState(null); // null = fechado; string = URL sendo editada
  const [subindo, setSubindo] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }),
      Image,
    ],
    content: valor,
    editorProps: { attributes: { class: "artigo min-h-[420px] p-5 sm:p-6 focus:outline-none" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // troca de artigo (ou primeira carga) atualiza o conteúdo sem perder o cursor durante a digitação
  useEffect(() => {
    if (editor && valor !== editor.getHTML()) editor.commands.setContent(valor || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, valor]);

  if (!editor) return null;

  const imagem = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setSubindo(true);
    try {
      const url = await enviarImagem(f);
      editor.chain().focus().setImage({ src: url }).createParagraphNear().run();
    } finally {
      setSubindo(false);
    }
  };

  const aplicarLink = () => {
    const url = (link || "").trim();
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: /^https?:\/\//.test(url) ? url : `https://${url}` }).run();
    else editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLink(null);
  };

  const Botao = ({ ativo, onClick, titulo, children, desativado }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={desativado}
      title={titulo}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 ${
        ativo ? "bg-black text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
      }`}
    >
      {children}
    </button>
  );
  const Sep = () => <span className="w-px h-5 bg-zinc-200 mx-1" />;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80">
      <div className="sticky top-0 z-10 bg-white rounded-t-2xl flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-zinc-100">
        <Botao titulo="Título" ativo={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={17} />
        </Botao>
        <Botao titulo="Subtítulo" ativo={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={17} />
        </Botao>
        <Sep />
        <Botao titulo="Negrito" ativo={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </Botao>
        <Botao titulo="Itálico (também serve para legenda de imagem)" ativo={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </Botao>
        <Botao titulo="Link" ativo={editor.isActive("link")} onClick={() => setLink(editor.getAttributes("link").href || "")}>
          <Link2 size={16} />
        </Botao>
        <Sep />
        <Botao titulo="Lista" ativo={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={17} />
        </Botao>
        <Botao titulo="Lista numerada" ativo={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={17} />
        </Botao>
        <Botao titulo="Frase de destaque" ativo={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </Botao>
        <Botao titulo="Linha divisória" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={17} />
        </Botao>
        <label title="Inserir imagem" className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-black cursor-pointer">
          {subindo ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          <input type="file" accept="image/*" className="hidden" onChange={imagem} disabled={subindo} />
        </label>
        <Sep />
        <Botao titulo="Desfazer" onClick={() => editor.chain().focus().undo().run()} desativado={!editor.can().undo()}>
          <Undo2 size={16} />
        </Botao>
        <Botao titulo="Refazer" onClick={() => editor.chain().focus().redo().run()} desativado={!editor.can().redo()}>
          <Redo2 size={16} />
        </Botao>
      </div>

      {link !== null && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 bg-zinc-50">
          <input
            autoFocus
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); aplicarLink(); } if (e.key === "Escape") setLink(null); }}
            placeholder="Cole o endereço (deixe vazio para tirar o link)"
            className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          />
          <button type="button" onClick={aplicarLink} className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center"><Check size={15} /></button>
          <button type="button" onClick={() => setLink(null)} className="w-8 h-8 rounded-lg text-zinc-500 hover:bg-zinc-200 flex items-center justify-center"><X size={15} /></button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
