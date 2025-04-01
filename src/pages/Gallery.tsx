
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GalleryHorizontal, ZoomIn, Download, Share2 } from 'lucide-react';

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Mock gallery data
  const galleryImages = [
    {
      id: 1,
      title: 'Office Opening Ceremony',
      description: 'Port Moresby HQ official opening',
      imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
      date: '15 Mar 2023',
      category: 'Events'
    },
    {
      id: 2,
      title: 'Team Building Workshop',
      description: 'Annual team retreat in Lae',
      imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
      date: '22 Apr 2023',
      category: 'Workshops'
    },
    {
      id: 3,
      title: 'Product Launch',
      description: 'New digital solution release',
      imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72',
      date: '14 Jun 2023',
      category: 'Products'
    },
    {
      id: 4,
      title: 'Client Meeting',
      description: 'Strategic partnership discussion',
      imageUrl: 'https://images.unsplash.com/photo-1552581234-26160f608093',
      date: '30 Jul 2023',
      category: 'Meetings'
    },
    {
      id: 5,
      title: 'Community Outreach',
      description: 'Local school technology program',
      imageUrl: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31',
      date: '12 Aug 2023',
      category: 'Community'
    },
    {
      id: 6,
      title: 'Award Ceremony',
      description: 'Excellence in Innovation Award',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
      date: '08 Sep 2023',
      category: 'Awards'
    },
    {
      id: 7,
      title: 'Executive Leadership Summit',
      description: 'Annual strategy planning session',
      imageUrl: 'https://images.unsplash.com/photo-1558403194-611308249627',
      date: '17 Oct 2023',
      category: 'Conferences'
    },
    {
      id: 8,
      title: 'Office Renovation',
      description: 'New collaborative workspace design',
      imageUrl: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76',
      date: '25 Nov 2023',
      category: 'Facilities'
    },
    {
      id: 9,
      title: 'Holiday Celebration',
      description: 'End of year staff appreciation event',
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176',
      date: '20 Dec 2023',
      category: 'Events'
    }
  ];

  // Handle image click to open in full view
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Close full image view
  const handleCloseFullView = () => {
    setSelectedImage(null);
  };

  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">SCPNG Image Gallery</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Browse and share organizational photos and media
        </p>
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {galleryImages.map((image) => (
          <Card 
            key={image.id} 
            className="overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-muted/80"
          >
            <div className="relative overflow-hidden h-48 cursor-pointer" onClick={() => handleImageClick(image.imageUrl)}>
              <img 
                src={`${image.imageUrl}?auto=format&fit=crop&w=600&q=80`} 
                alt={image.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-white text-sm">{image.date}</span>
                <span className="bg-intranet-primary text-white text-xs py-0.5 px-2 rounded-full w-fit mt-1">
                  {image.category}
                </span>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-1">{image.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{image.description}</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="icon-hover-effect">
                  <Share2 size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="icon-hover-effect">
                  <Download size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full image view modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={handleCloseFullView}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-card rounded-lg overflow-hidden shadow-xl">
              <div className="relative">
                <img 
                  src={`${selectedImage}?auto=format&q=90`} 
                  alt="Full size image" 
                  className="w-full object-contain max-h-[80vh]"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={handleCloseFullView}
                >
                  X
                </Button>
              </div>
              <div className="p-4 flex justify-between">
                <Button variant="outline" size="sm" className="icon-hover-effect">
                  <ZoomIn size={16} className="mr-1" />
                  Zoom
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="icon-hover-effect">
                    <Share2 size={16} className="mr-1" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" className="icon-hover-effect">
                    <Download size={16} className="mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Gallery;
