import { supabase } from '@/lib/supabaseClient';

export interface GalleryEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  year: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
}

export interface GalleryPhoto {
  id: string;
  event_id: string;
  caption?: string;
  image_url: string;
  sharepoint_url?: string;
  file_name?: string;
  file_size?: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
  is_active: boolean;
}

export interface GalleryEventWithPhotos extends GalleryEvent {
  images: GalleryPhoto[];
}

export interface GalleryData {
  [year: string]: GalleryEventWithPhotos[];
}

class GalleryService {
  /**
   * Get all gallery events with their photos, organized by year
   */
  async getGalleryData(): Promise<GalleryData> {
    try {
      console.log('🔍 [GalleryService] Starting getGalleryData...');

      // First, get all active events
      const { data: events, error: eventsError } = await supabase
        .from('gallery_events')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false });

      if (eventsError) {
        console.error('❌ [GalleryService] Error fetching events:', eventsError);
        throw eventsError;
      }

      console.log('✅ [GalleryService] Events fetched:', events?.length, 'events');
      console.log('📄 [GalleryService] Events data:', events);

      if (!events || events.length === 0) {
        console.log('⚠️ [GalleryService] No events found, returning empty data');
        return {};
      }

      // Then, get all active photos
      const { data: photos, error: photosError } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (photosError) {
        console.error('❌ [GalleryService] Error fetching photos:', photosError);
        throw photosError;
      }

      console.log('✅ [GalleryService] Photos fetched:', photos?.length, 'photos');
      console.log('📸 [GalleryService] Photos data sample:', photos?.slice(0, 3));

      if (!photos || photos.length === 0) {
        console.log('⚠️ [GalleryService] No photos found, returning empty data');
        return {};
      }

      // Manually join the data
      const galleryData: GalleryData = {};

      events.forEach((event: any) => {
        console.log(`🔗 [GalleryService] Processing event: ${event.title} (${event.id})`);
        
        // Find photos for this event
        const eventPhotos = photos.filter((photo: any) => photo.event_id === event.id);
        console.log(`📸 [GalleryService] Found ${eventPhotos.length} photos for event ${event.title}`);

        // Only include events that have photos
        if (eventPhotos.length > 0) {
          const year = event.year.toString();
          
          const eventWithPhotos: GalleryEventWithPhotos = {
            ...event,
            images: eventPhotos.map((photo: any) => ({
              ...photo,
              url: photo.image_url, // Add legacy 'url' field for compatibility
            }))
          };

          if (!galleryData[year]) {
            galleryData[year] = [];
          }
          galleryData[year].push(eventWithPhotos);
          
          console.log(`✅ [GalleryService] Added event ${event.title} to year ${year}`);
        } else {
          console.log(`⚠️ [GalleryService] Skipping event ${event.title} - no photos`);
        }
      });

      // Sort events within each year by date (newest first)
      Object.keys(galleryData).forEach(year => {
        galleryData[year].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        console.log(`📅 [GalleryService] Sorted ${galleryData[year].length} events for year ${year}`);
      });

      console.log('🎉 [GalleryService] Final gallery data:', galleryData);
      console.log('📊 [GalleryService] Years with data:', Object.keys(galleryData));
      
      return galleryData;
    } catch (error) {
      console.error('💥 [GalleryService] Error in getGalleryData:', error);
      throw error;
    }
  }

  /**
   * Get all active gallery events (for dropdown selections)
   */
  async getEvents(): Promise<GalleryEvent[]> {
    try {
      const { data, error } = await supabase
        .from('gallery_events')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching gallery events:', error);
      throw error;
    }
  }

  /**
   * Create a new gallery event
   */
  async createEvent(eventData: {
    title: string;
    date: string;
    description?: string;
  }): Promise<GalleryEvent> {
    try {
      const { data, error } = await supabase
        .from('gallery_events')
        .insert({
          ...eventData,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating gallery event:', error);
      throw error;
    }
  }

  /**
   * Add a photo to a gallery event
   */
  async addPhoto(photoData: {
    event_id: string;
    caption?: string;
    image_url: string;
    sharepoint_url?: string;
    file_name?: string;
    file_size?: number;
    display_order?: number;
  }): Promise<GalleryPhoto> {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .insert({
          ...photoData,
          is_active: true,
          display_order: photoData.display_order || 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding gallery photo:', error);
      throw error;
    }
  }

  /**
   * Update a photo's caption or display order
   */
  async updatePhoto(photoId: string, updates: {
    caption?: string;
    display_order?: number;
  }): Promise<GalleryPhoto> {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .update(updates)
        .eq('id', photoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating gallery photo:', error);
      throw error;
    }
  }

  /**
   * Delete a photo (soft delete by setting is_active to false)
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('gallery_photos')
        .update({ is_active: false })
        .eq('id', photoId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting gallery photo:', error);
      throw error;
    }
  }

  /**
   * Update an event
   */
  async updateEvent(eventId: string, updates: {
    title?: string;
    date?: string;
    description?: string;
  }): Promise<GalleryEvent> {
    try {
      const { data, error } = await supabase
        .from('gallery_events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating gallery event:', error);
      throw error;
    }
  }

  /**
   * Delete an event (soft delete by setting is_active to false)
   * This will also cascade to hide all photos in the event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      // First, deactivate all photos in the event
      await supabase
        .from('gallery_photos')
        .update({ is_active: false })
        .eq('event_id', eventId);

      // Then deactivate the event
      const { error } = await supabase
        .from('gallery_events')
        .update({ is_active: false })
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting gallery event:', error);
      throw error;
    }
  }
}

export const galleryService = new GalleryService(); 