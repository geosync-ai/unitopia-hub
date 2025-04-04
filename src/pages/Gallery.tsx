
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Sample gallery data organized by year and events
const galleryData = {
  "2024": [
    {
      id: "annual-meeting-2024",
      title: "Annual Stakeholder Meeting",
      date: "March 15, 2024",
      description: "Annual meeting with key stakeholders at MRDC House",
      images: [
        { id: "am24-1", url: "https://picsum.photos/id/237/800/600", caption: "Opening address by CEO" },
        { id: "am24-2", url: "https://picsum.photos/id/238/800/600", caption: "Panel discussion" },
        { id: "am24-3", url: "https://picsum.photos/id/239/800/600", caption: "Q&A session" },
        { id: "am24-4", url: "https://picsum.photos/id/240/800/600", caption: "Networking session" },
      ]
    },
    {
      id: "training-2024",
      title: "Staff Training Workshop",
      date: "February 5, 2024",
      description: "Professional development training for department heads",
      images: [
        { id: "tr24-1", url: "https://picsum.photos/id/241/800/600", caption: "Workshop introduction" },
        { id: "tr24-2", url: "https://picsum.photos/id/242/800/600", caption: "Group activities" },
        { id: "tr24-3", url: "https://picsum.photos/id/243/800/600", caption: "Presentation session" },
      ]
    }
  ],
  "2023": [
    {
      id: "annual-meeting-2023",
      title: "Annual Stakeholder Meeting",
      date: "March 10, 2023",
      description: "Previous year's annual meeting with stakeholders",
      images: [
        { id: "am23-1", url: "https://picsum.photos/id/244/800/600", caption: "2023 CEO presentation" },
        { id: "am23-2", url: "https://picsum.photos/id/245/800/600", caption: "Financial review" },
        { id: "am23-3", url: "https://picsum.photos/id/246/800/600", caption: "Strategic planning session" },
      ]
    },
    {
      id: "community-event-2023",
      title: "Community Outreach Program",
      date: "August 22, 2023",
      description: "Community engagement initiatives in local areas",
      images: [
        { id: "ce23-1", url: "https://picsum.photos/id/247/800/600", caption: "Opening ceremony" },
        { id: "ce23-2", url: "https://picsum.photos/id/248/800/600", caption: "Community activities" },
        { id: "ce23-3", url: "https://picsum.photos/id/249/800/600", caption: "Donation handover" },
        { id: "ce23-4", url: "https://picsum.photos/id/250/800/600", caption: "Group photo" },
        { id: "ce23-5", url: "https://picsum.photos/id/251/800/600", caption: "Closing remarks" },
      ]
    }
  ]
};

type GalleryImage = {
  id: string;
  url: string;
  caption: string;
};

type GalleryEvent = {
  id: string;
  title: string;
  date: string;
  description: string;
  images: GalleryImage[];
};

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GalleryEvent | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  
  const handleImageClick = (image: GalleryImage, event: GalleryEvent, index: number) => {
    setSelectedImage(image);
    setCurrentEvent(event);
    setImageIndex(index);
  };
  
  const navigateImage = (direction: 'prev' | 'next') => {
    if (!currentEvent) return;
    
    const newIndex = direction === 'prev' 
      ? (imageIndex - 1 + currentEvent.images.length) % currentEvent.images.length 
      : (imageIndex + 1) % currentEvent.images.length;
    
    setImageIndex(newIndex);
    setSelectedImage(currentEvent.images[newIndex]);
  };
  
  const years = Object.keys(galleryData).sort().reverse();
  
  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Media Gallery</h1>
        <p className="text-muted-foreground">Browse photos from SCPNG events and activities</p>
      </div>
      
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
            {galleryData[year as keyof typeof galleryData].map((event) => (
              <div key={event.id} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{event.title}</h2>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                    <span>{event.date}</span>
                    <span className="text-xs">•</span>
                    <span>{event.description}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {event.images.map((image, index) => (
                    <Card 
                      key={image.id} 
                      className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => handleImageClick(image, event, index)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square relative">
                          <img 
                            src={image.url} 
                            alt={image.caption} 
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-white text-xs line-clamp-2">{image.caption}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Fullscreen Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
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
    </PageLayout>
  );
};

export default Gallery;
