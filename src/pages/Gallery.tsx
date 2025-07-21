
import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import AddPhotoModal from '@/components/gallery/AddPhotoModal';
import GalleryDebug from '@/components/gallery/GalleryDebug';
import { galleryService, type GalleryEventWithPhotos, type GalleryData } from '@/integrations/supabase/galleryService';
import { toast } from 'sonner';

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
  
  // Load gallery data
  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
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
  };

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Media Gallery</h1>
          <p className="text-muted-foreground">Browse photos from SCPNG events and activities</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline">
            {showDebug ? 'Hide Debug' : 'Debug Data'}
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
                    {event.images.map((image, index) => (
                      <Card 
                        key={image.id} 
                        className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                        onClick={() => handleImageClick({
                          id: image.id,
                          url: image.image_url,
                          caption: image.caption || ''
                        }, event, index)}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square relative">
                            <img 
                              src={image.image_url} 
                              alt={image.caption || `Photo from ${event.title}`} 
                              className="object-cover w-full h-full"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
                              <span className="text-white text-xs line-clamp-2">
                                {image.caption || `Photo from ${event.title}`}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
              <div className="text-sm">
                {imageIndex + 1} of {currentEvent?.images.length}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="icon" 
                  onClick={() => navigateImage('next')}
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

      {/* Add Photo Modal */}
      <AddPhotoModal
        isOpen={isAddPhotoModalOpen}
        onClose={() => setIsAddPhotoModalOpen(false)}
        onPhotoAdded={handlePhotoAdded}
      />
    </PageLayout>
  );
};

export default Gallery;
