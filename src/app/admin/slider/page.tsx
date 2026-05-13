"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/AdminShell";
import { Plus, Trash2, Save, Image as ImageIcon, GripVertical, ExternalLink } from "lucide-react";

interface SliderImage {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  sortOrder: number;
}

export default function SliderAdmin() {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    const token = localStorage.getItem("admin_token");
    fetch("/api/admin/slider", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setImages(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const token = () => localStorage.getItem("admin_token") || "";

  const uploadImage = async (file: File, sliderImageId?: number) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Upload failed"); return; }

      if (sliderImageId) {
        setImages((prev) =>
          prev.map((img) => (img.id === sliderImageId ? { ...img, imageUrl: data.url } : img))
        );
      } else {
        const createRes = await fetch("/api/admin/slider", {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: data.url, title: file.name.replace(/\.[^.]+$/, ""), sortOrder: images.length }),
        });
        const created = await createRes.json();
        setImages((prev) => [...prev, created]);
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveImage = async (img: SliderImage) => {
    setSaving(true);
    try {
      await fetch("/api/admin/slider", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify(img),
      });
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteImage = async (id: number) => {
    if (!confirm("Delete this slider image?")) return;
    await fetch(`/api/admin/slider?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  const updateField = (id: number, field: string, value: string | boolean | number) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, [field]: value } : img)));
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Image Slider</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage homepage rotating image slider</p>
        </div>
        <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6366f1] text-white font-semibold text-sm cursor-pointer hover:bg-[#4f46e5] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <Plus className="h-4 w-4" />
          {uploading ? "Uploading..." : "Add Image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#6b7280]">Loading...</div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-16 text-center">
          <ImageIcon className="h-12 w-12 text-[#d1d5db] mx-auto mb-4" />
          <p className="text-[#6b7280] mb-2">No slider images yet</p>
          <p className="text-sm text-[#9ca3af]">Upload images to create a rotating slider on the homepage</p>
        </div>
      ) : (
        <div className="space-y-4">
          {images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => (
            <div key={img.id} className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
              <div className="flex gap-5">
                <div className="flex items-start pt-1">
                  <GripVertical className="h-5 w-5 text-[#d1d5db]" />
                </div>

                <div className="w-48 h-28 rounded-xl overflow-hidden bg-[#f3f4f6] shrink-0 border border-[#e5e7eb]">
                  {img.imageUrl ? (
                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-8 w-8 text-[#d1d5db]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#6b7280] mb-1">Title</label>
                      <input
                        type="text"
                        value={img.title}
                        onChange={(e) => updateField(img.id, "title", e.target.value)}
                        className="input-field text-sm"
                        placeholder="Image title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6b7280] mb-1">Link URL (optional)</label>
                      <div className="relative">
                        <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                        <input
                          type="text"
                          value={img.linkUrl}
                          onChange={(e) => updateField(img.id, "linkUrl", e.target.value)}
                          className="input-field text-sm pl-9"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-[#6b7280]">Order:</label>
                      <input
                        type="number"
                        value={img.sortOrder}
                        onChange={(e) => updateField(img.id, "sortOrder", Number(e.target.value))}
                        className="input-field text-sm w-16 text-center"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={img.active}
                        onChange={(e) => updateField(img.id, "active", e.target.checked)}
                        className="h-4 w-4 rounded accent-[#6366f1]"
                      />
                      <span className="text-xs font-medium text-[#6b7280]">Active</span>
                    </label>
                    <label className="text-xs text-[#6366f1] font-medium cursor-pointer hover:underline">
                      Replace Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, img.id);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => saveImage(img)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366f1] text-white text-xs font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
