
import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Plus, Image as ImageIcon, Loader2, Trash2, Pencil, CheckSquare, XSquare } from 'lucide-react';
import AddPhotoModal from '@/components/gallery/AddPhotoModal';
import EditPhotoModal from '@/components/gallery/EditPhotoModal';
import GalleryDebug from '@/components/gallery/GalleryDebug';
import { galleryService, type GalleryEventWithPhotos, type GalleryData, type GalleryPhoto } from '@/integrations/supabase/galleryService';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

type GalleryImage = {
  id: string;
  url: string;
  caption: string;
};

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GalleryEventWithPhotos | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [galleryData, setGalleryData] = useState<GalleryData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<GalleryImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<GalleryPhoto | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  // Load gallery data
  const loadGalleryData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Loading gallery data...');
      const data = await galleryService.getGalleryData();
      console.log('Gallery data loaded:', data);
      setGalleryData(data);
    } catch (err: any) {
      console.error('Failed to load gallery data:', err);
      setError('Failed to load gallery photos');
      toast.error('Failed to load gallery photos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGalleryData();
  }, []);

  const handleImageClick = (image: GalleryImage, event: GalleryEventWithPhotos, index: number) => {
    setSelectedImage(image);
    setCurrentEvent(event);
    setImageIndex(index);
  };
  
  const navigateImage = (direction: 'prev' | 'next') => {
    if (!currentEvent) return;
    
    // Convert the photos to the expected format
    const images = currentEvent.images.map(photo => ({
      id: photo.id,
      url: photo.image_url,
      caption: photo.caption || ''
    }));
    
    const newIndex = direction === 'prev' 
      ? (imageIndex - 1 + images.length) % images.length 
      : (imageIndex + 1) % images.length;
    
    setImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const handlePhotoAdded = () => {
    // Reload gallery data when new photos are added
    loadGalleryData();
    toast.success('Photos added to gallery successfully!');
  };

  const handlePhotoUpdated = (updatedPhoto: GalleryPhoto) => {
    setGalleryData(prevData => {
      const newData = { ...prevData };
      for (const year in newData) {
        newData[year] = newData[year].map(event => {
          const imageIndex = event.images.findIndex(img => img.id === updatedPhoto.id);
          if (imageIndex > -1) {
            const updatedImages = [...event.images];
            updatedImages[imageIndex] = { ...updatedImages[imageIndex], ...updatedPhoto };
            return { ...event, images: updatedImages };
          }
          return event;
        });
      }
      return newData;
    });

    if (selectedImage?.id === updatedPhoto.id) {
      setSelectedImage(prev => prev ? { ...prev, caption: updatedPhoto.caption || '' } : null);
    }
  };

  const openEditModal = (photo: GalleryPhoto, event: React.MouseEvent) => {
    event.stopPropagation();
    setPhotoToEdit(photo);
    setIsEditModalOpen(true);
  };

  const openDeleteConfirm = (image: GalleryImage, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the image click handler from firing
    setPhotoToDelete(image);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    setIsDeleting(true);
    try {
      await galleryService.deletePhoto(photoToDelete.id);
      toast.success('Photo deleted successfully!');

      // Update the UI optimistically
      setGalleryData(prevData => {
        const newData = { ...prevData };
        for (const year in newData) {
          newData[year] = newData[year].map(event => {
            const updatedImages = event.images.filter(img => img.id !== photoToDelete.id);
            return { ...event, images: updatedImages };
          }).filter(event => event.images.length > 0); // Remove event if it has no photos left
        }
        return newData;
      });

      // If the deleted photo was the one being viewed, close the dialog
      if (selectedImage?.id === photoToDelete.id) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
      toast.error('Failed to delete photo. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteDialogOpen(false);
      setPhotoToDelete(null);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev);
    setSelectedPhotos(new Set()); // Clear selection when toggling mode
  };

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(photoId)) {
        newSelection.delete(photoId);
      } else {
        newSelection.add(photoId);
      }
      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) {
      toast.info('No photos selected.');
      return;
    }

    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedPhotos);
      await galleryService.deleteMultiplePhotos(idsToDelete);
      toast.success(`${idsToDelete.length} photos deleted successfully!`);

      setGalleryData(prevData => {
        const newData = { ...prevData };
        for (const year in newData) {
          newData[year] = newData[year].map(event => ({
            ...event,
            images: event.images.filter(img => !idsToDelete.includes(img.id)),
          })).filter(event => event.images.length > 0);
        }
        return newData;
      });

      if (selectedImage && idsToDelete.includes(selectedImage.id)) {
        setSelectedImage(null);
      }
      
      toggleSelectMode(); // Exit select mode after deletion
    } catch (err) {
      console.error('Failed to delete selected photos:', err);
      toast.error('Failed to delete selected photos. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Media Gallery</h1>
          <p className="text-muted-foreground">Browse photos from SCPNG events and activities</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading gallery photos...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Media Gallery</h1>
          <p className="text-muted-foreground">Browse photos from SCPNG events and activities</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Failed to Load Gallery</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadGalleryData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  const years = Object.keys(galleryData).sort().reverse();

  // Show empty state if no data
  if (years.length === 0) {
    return (
      <PageLayout>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Media Gallery</h1>
            <p className="text-muted-foreground">Browse photos from SCPNG events and activities</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowDebug(!showDebug)} variant="outline">
              {showDebug ? 'Hide Debug' : 'Debug Data'}
            </Button>
            <Button onClick={toggleSelectMode} variant={isSelectMode ? 'secondary' : 'outline'}>
              {isSelectMode ? 'Cancel' : 'Select Photos'}
            </Button>
            <Button onClick={() => setIsAddPhotoModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Photos
            </Button>
          </div>
        </div>
        
        {showDebug && (
          <div className="mb-6">
            <GalleryDebug />
          </div>
        )}
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No Photos Yet</p>
            <p className="text-muted-foreground mb-4">Start building your gallery by adding your first photos</p>
            <Button onClick={() => setIsAddPhotoModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add First Photos
            </Button>
          </div>
        </div>

        <AddPhotoModal
          isOpen={isAddPhotoModalOpen}
          onClose={() => setIsAddPhotoModalOpen(false)}
          onPhotoAdded={handlePhotoAdded}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {isSelectMode && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-4 border-b mb-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {selectedPhotos.size} photo(s) selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={selectedPhotos.size === 0 || isDeleting}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Selected
              </Button>
              <Button variant="outline" size="sm" onClick={toggleSelectMode}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Media Gallery</h1>
          <p className="text-muted-foreground">Browse photos from SCPNG events and activities</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline">
            {showDebug ? 'Hide Debug' : 'Debug Data'}
          </Button>
          <Button onClick={toggleSelectMode} variant={isSelectMode ? 'secondary' : 'outline'}>
            <CheckSquare className="h-4 w-4 mr-2" />
            {isSelectMode ? 'Cancel' : 'Select Photos'}
          </Button>
          <Button onClick={() => setIsAddPhotoModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Photos
          </Button>
        </div>
      </div>
      
      {showDebug && (
        <div className="mb-6">
          <GalleryDebug />
        </div>
      )}
      
      <Tabs defaultValue={years[0]} className="w-full">
        <TabsList className="mb-6">
          {years.map(year => (
            <TabsTrigger key={year} value={year}>
              {year}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {years.map(year => (
          <TabsContent key={year} value={year} className="space-y-8">
            {galleryData[year].map((event) => (
              <div key={event.id} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{event.title}</h2>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    {event.description && (
                      <>
                        <span className="text-xs">•</span>
                        <span>{event.description}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {event.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {event.images.map((image, index) => {
                      const galleryImage = {
                        id: image.id,
                        url: image.image_url,
                        caption: image.caption || ''
                      };
                      const isSelected = selectedPhotos.has(image.id);

                      return (
                        <Card 
                          key={image.id} 
                          className={`overflow-hidden transition-all group ${isSelectMode ? 'cursor-pointer' : 'cursor-pointer transition-transform hover:scale-[1.02]'}`}
                          onClick={() => isSelectMode ? handleSelectPhoto(image.id) : handleImageClick(galleryImage, event, index)}
                        >
                          <CardContent className="p-0">
                            <div className={`aspect-square relative ${isSelectMode && isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                              <img 
                                src={image.image_url} 
                                alt={image.caption || `Photo from ${event.title}`} 
                                className="object-cover w-full h-full"
                                loading="lazy"
                              />
                              {isSelectMode && (
                                <div className="absolute top-2 left-2 z-10">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleSelectPhoto(image.id)}
                                    className="bg-background/50 border-white"
                                  />
                                </div>
                              )}
                              <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity ${isSelectMode ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'}`}></div>
                              <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs line-clamp-2">
                                  {image.caption || `Photo from ${event.title}`}
                                </span>
                                {!isSelectMode && (
                                  <div className="absolute top-2 right-2 flex gap-1.5">
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => openEditModal(image, e)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => openDeleteConfirm(galleryImage, e)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>No photos in this event yet</p>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Fullscreen Image Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 bg-background/95 backdrop-blur-sm">
          <div className="relative h-full flex flex-col">
            <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
              <DialogTitle className="text-white">{currentEvent?.title}</DialogTitle>
              <DialogDescription className="text-white/80">{selectedImage?.caption}</DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 flex items-center justify-center p-4 pt-16">
              <img
                src={selectedImage?.url}
                alt={selectedImage?.caption}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
            
            <div className="p-4 flex justify-between items-center border-t">
              <div className="text-sm text-muted-foreground">
                {currentEvent && currentEvent.images.length > 0
                  ? `${imageIndex + 1} of ${currentEvent.images.length}`
                  : 'No images'}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    const fullPhoto = currentEvent?.images.find(p => p.id === selectedImage?.id);
                    if (fullPhoto) openEditModal(fullPhoto, e);
                  }}
                  disabled={!selectedImage}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => selectedImage && openDeleteConfirm(selectedImage, e)}
                  disabled={!selectedImage}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateImage('prev')}
                  disabled={!currentEvent || currentEvent.images.length <= 1}
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="icon" 
                  onClick={() => navigateImage('next')}
                  disabled={!currentEvent || currentEvent.images.length <= 1}
                >
                  <ChevronRight size={18} />
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" size="icon">
                    <X size={18} />
                  </Button>
                </DialogClose>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting Photo */}
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the photo from the gallery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePhoto} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Photo Modal */}
      <AddPhotoModal
        isOpen={isAddPhotoModalOpen}
        onClose={() => setIsAddPhotoModalOpen(false)}
        onPhotoAdded={handlePhotoAdded}
      />

      <EditPhotoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        photo={photoToEdit}
        onPhotoUpdated={handlePhotoUpdated}
      />
    </PageLayout>
  );
};

export default Gallery;
