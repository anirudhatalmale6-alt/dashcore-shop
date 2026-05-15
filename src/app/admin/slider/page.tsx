"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminShell from "@/components/AdminShell";
import { Plus, Trash2, Save, Image as ImageIcon, GripVertical, ExternalLink, Upload } from "lucide-react";

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
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  const load = useCallback(() => {
    const token = localStorage.getItem("admin_token");
    fetch("/api/admin/slider", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setImages(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const token = () => localStorage.getItem("admin_token") || "";

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  /* ── Upload single file, optionally replace existing ── */
  const uploadSingleFile = async (file: File, sliderImageId?: number): Promise<SliderImage | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) { throw new Error(data.error || "Upload failed"); }

    if (sliderImageId) {
      // Replace existing image
      setImages((prev) =>
        prev.map((img) => (img.id === sliderImageId ? { ...img, imageUrl: data.url } : img))
      );
      return null;
    } else {
      // Create new slider entry
      const currentImages = images;
      const maxSort = currentImages.length > 0 ? Math.max(...currentImages.map(i => i.sortOrder)) : -1;
      const createRes = await fetch("/api/admin/slider", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: data.url,
          title: file.name.replace(/\.[^.]+$/, ""),
          sortOrder: maxSort + 1,
        }),
      });
      const created = await createRes.json();
      return created;
    }
  };

  /* ── Multi-file upload ── */
  const uploadMultipleFiles = async (files: FileList) => {
    if (files.length === 0) return;
    setUploading(true);
    const newImages: SliderImage[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        const created = await uploadSingleFile(files[i]);
        if (created) newImages.push(created);
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch {
      alert("One or more uploads failed");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  /* ── Replace single image ── */
  const replaceImage = async (file: File, sliderImageId: number) => {
    setUploading(true);
    try {
      await uploadSingleFile(file, sliderImageId);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ── Save single image ── */
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

  /* ── Save sort orders for all images (after drag-drop) ── */
  const saveSortOrders = async (updatedImages: SliderImage[]) => {
    setSaving(true);
    try {
      await Promise.all(
        updatedImages.map((img) =>
          fetch("/api/admin/slider", {
            method: "PUT",
            headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
            body: JSON.stringify({ id: img.id, sortOrder: img.sortOrder, title: img.title, imageUrl: img.imageUrl, linkUrl: img.linkUrl, active: img.active }),
          })
        )
      );
    } catch {
      alert("Failed to save sort order");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
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

  /* ── Drag-and-drop handlers ── */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    dragItemRef.current = id;
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "1";
    }
    setDragOverId(null);
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverItemRef.current = id;
    setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
    e.preventDefault();
    setDragOverId(null);

    const dragId = dragItemRef.current;
    if (dragId === null || dragId === targetId) return;

    const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
    const dragIndex = sorted.findIndex((i) => i.id === dragId);
    const targetIndex = sorted.findIndex((i) => i.id === targetId);

    if (dragIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const reordered = [...sorted];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Reassign sort orders
    const updated = reordered.map((img, idx) => ({ ...img, sortOrder: idx }));
    setImages(updated);

    // Auto-save sort orders
    saveSortOrders(updated);
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Image Slider</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage homepage rotating image slider. Drag items to reorder.</p>
        </div>
        <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6366f1] text-white font-semibold text-sm cursor-pointer hover:bg-[#4f46e5] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <Plus className="h-4 w-4" />
          {uploading ? (uploadProgress || "Uploading...") : "Add Images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) uploadMultipleFiles(files);
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
          <p className="text-sm text-[#9ca3af] mb-6">Upload images to create a rotating slider on the homepage</p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6366f1] text-white font-semibold text-sm cursor-pointer hover:bg-[#4f46e5] transition-colors">
            <Upload className="h-4 w-4" />
            Select Images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) uploadMultipleFiles(files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          {saving && (
            <div className="text-center text-sm text-[#6366f1] font-medium py-1">Saving...</div>
          )}
          {sortedImages.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => handleDragStart(e, img.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, img.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, img.id)}
              className={`bg-white rounded-2xl border-2 p-5 transition-all ${
                dragOverId === img.id
                  ? "border-[#6366f1] bg-[#6366f1]/5 shadow-md"
                  : "border-[#e5e7eb] hover:border-[#d1d5db]"
              }`}
            >
              <div className="flex gap-5">
                {/* Drag handle */}
                <div className="flex items-center cursor-grab active:cursor-grabbing pt-1">
                  <GripVertical className="h-5 w-5 text-[#9ca3af] hover:text-[#6366f1] transition-colors" />
                </div>

                {/* Image preview */}
                <div className="w-48 h-28 rounded-xl overflow-hidden bg-[#f3f4f6] shrink-0 border border-[#e5e7eb] relative group">
                  {img.imageUrl ? (
                    <>
                      <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-lg">Replace</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) replaceImage(file, img.id);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </>
                  ) : (
                    <label className="flex items-center justify-center h-full cursor-pointer hover:bg-[#e5e7eb] transition-colors">
                      <ImageIcon className="h-8 w-8 text-[#d1d5db]" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) replaceImage(file, img.id);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#374151] mb-1">Caption</label>
                      <input
                        type="text"
                        value={img.title}
                        onChange={(e) => updateField(img.id, "title", e.target.value)}
                        className="input-field text-sm"
                        placeholder="Caption shown on slider overlay"
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
