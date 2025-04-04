
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GalleryHorizontal, ZoomIn, Download, Share2, Filter, Search, Upload, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Mock gallery data with years and events
  const galleryImages = [
    {
      id: 1,
      title: 'Office Opening Ceremony',
      description: 'Port Moresby HQ official opening',
      imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
      date: '15 Mar 2023',
      year: '2023',
      category: 'Events'
    },
    {
      id: 2,
      title: 'Team Building Workshop',
      description: 'Annual team retreat in Lae',
      imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
      date: '22 Apr 2023',
      year: '2023',
      category: 'Workshops'
    },
    {
      id: 3,
      title: 'Product Launch',
      description: 'New digital solution release',
      imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72',
      date: '14 Jun 2023',
      year: '2023',
      category: 'Products'
    },
    {
      id: 4,
      title: 'Client Meeting',
      description: 'Strategic partnership discussion',
      imageUrl: 'https://images.unsplash.com/photo-1552581234-26160f608093',
      date: '30 Jul 2023',
      year: '2023',
      category: 'Meetings'
    },
    {
      id: 5,
      title: 'Community Outreach',
      description: 'Local school technology program',
      imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
      date: '12 Aug 2023',
      year: '2023',
      category: 'Community'
    },
    {
      id: 6,
      title: 'Award Ceremony',
      description: 'Excellence in Innovation Award',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
      date: '08 Sep 2023',
      year: '2023',
      category: 'Awards'
    },
    {
      id: 7,
      title: 'Executive Leadership Summit',
      description: 'Annual strategy planning session',
      imageUrl: 'https://images.unsplash.com/photo-1558403194-611308249627',
      date: '17 Oct 2023',
      year: '2023',
      category: 'Conferences'
    },
    {
      id: 8,
      title: 'Office Renovation',
      description: 'New collaborative workspace design',
      imageUrl: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76',
      date: '25 Nov 2023',
      year: '2023',
      category: 'Facilities'
    },
    {
      id: 9,
      title: 'Holiday Celebration',
      description: 'End of year staff appreciation event',
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176',
      date: '20 Dec 2023',
      year: '2023',
      category: 'Events'
    },
    {
      id: 10,
      title: 'Annual Conference 2024',
      description: 'Company-wide annual conference',
      imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b',
      date: '15 Feb 2024',
      year: '2024',
      category: 'Conferences'
    },
    {
      id: 11,
      title: 'New Office Branch Opening',
      description: 'Official opening of Lae branch office',
      imageUrl: 'https://images.unsplash.com/photo-1462826303086-329426d1aef5',
      date: '10 Mar 2024',
      year: '2024',
      category: 'Events'
    },
    {
      id: 12,
      title: 'Technology Expo',
      description: 'Showcasing new IT infrastructure',
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
      date: '22 Mar 2024',
      year: '2024',
      category: 'Exhibitions'
    }
  ];

  // Extract unique years and categories
  const years = Array.from(new Set(galleryImages.map(img => img.year))).sort();
  const categories = Array.from(new Set(galleryImages.map(img => img.category))).sort();

  // Filter gallery images based on search, year, and category
  const filteredImages = galleryImages.filter(image => {
    const matchesSearch = searchTerm === '' || 
      image.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      image.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear === null || image.year === selectedYear;
    const matchesCategory = selectedCategory === null || image.category === selectedCategory;
    
    return matchesSearch && matchesYear && matchesCategory;
  });

  // Group images by event (using category as proxy for event)
  const groupedByEvent = filteredImages.reduce((acc, image) => {
    if (!acc[image.category]) {
      acc[image.category] = [];
    }
    acc[image.category].push(image);
    return acc;
  }, {} as Record<string, typeof galleryImages>);

  // Handle image click to open in full view
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Close full image view
  const handleCloseFullView = () => {
    setSelectedImage(null);
  };

  // Handle file upload (mock)
  const handleFileUpload = () => {
    // This would be connected to actual file upload functionality
    alert('File upload functionality would be implemented here');
  };

  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">SCPNG Image Gallery</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Browse and share organizational photos and media
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        {/* Search bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search gallery..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter by year */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium">Year:</span>
          {years.map(year => (
            <Button 
              key={year}
              size="sm"
              variant={selectedYear === year ? "default" : "outline"}
              onClick={() => setSelectedYear(selectedYear === year ? null : year)}
              className="text-xs"
            >
              {year}
            </Button>
          ))}
          {selectedYear && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setSelectedYear(null)} 
              className="p-1 h-7 w-7"
            >
              <X size={14} />
            </Button>
          )}
        </div>

        {/* Upload button */}
        <Button onClick={handleFileUpload} className="whitespace-nowrap">
          <Upload size={18} className="mr-2" />
          Upload Images
        </Button>
      </div>

      <Tabs defaultValue="grid" className="mb-6">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="events">Event View</TabsTrigger>
        </TabsList>

        {/* Grid View */}
        <TabsContent value="grid">
          {filteredImages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No images match your search criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredImages.map((image) => (
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
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">{image.date}</span>
                        <span className="bg-intranet-primary text-white text-xs py-0.5 px-2 rounded-full">
                          {image.category}
                        </span>
                      </div>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleImageClick(image.imageUrl)}
                        className="icon-hover-effect"
                      >
                        <ZoomIn size={16} className="mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Event View */}
        <TabsContent value="events">
          {Object.entries(groupedByEvent).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No events match your search criteria
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByEvent).map(([eventName, images]) => (
                <div key={eventName} className="animate-fade-in">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold">{eventName}</h3>
                    <span className="text-sm text-gray-500">{images.length} photos</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map(image => (
                      <div 
                        key={image.id} 
                        className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:shadow-md transition-all"
                        onClick={() => handleImageClick(image.imageUrl)}
                      >
                        <img 
                          src={`${image.imageUrl}?auto=format&fit=crop&w=300&h=300&q=80`} 
                          alt={image.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                  <X size={18} />
                </Button>
                
                {/* Navigation buttons - would be connected to actual navigation */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  &lt;
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  &gt;
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
