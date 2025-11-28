-- Migration: Create Storage Buckets
-- Description: Implements section 4.2 of technical-001.md
-- Creates storage buckets and RLS policies for file storage

-- ============================================================================
-- Storage Buckets Creation
-- ============================================================================

-- Facilities bucket: Facility photos and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'facilities',
  'facilities',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Units bucket: Unit photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'units',
  'units',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Customers bucket: Customer documents (ID, agreements)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customers',
  'customers',
  false, -- Private bucket
  10485760, -- 10MB limit (smaller for documents)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Rentals bucket: Rental agreements and addendums
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rentals',
  'rentals',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Maintenance bucket: Maintenance photos and reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance',
  'maintenance',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket: User profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket (profile pictures can be public)
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Bucket Policies (RLS)
-- ============================================================================

-- ============================================================================
-- Facilities Bucket Policies
-- ============================================================================

-- Users can view files in facilities bucket if they own the facility
CREATE POLICY "Users can view facility files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'facilities' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM facilities WHERE owner_id = auth.uid()
  )
);

-- Users can upload files to facilities bucket for their own facilities
CREATE POLICY "Users can upload facility files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'facilities' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM facilities WHERE owner_id = auth.uid()
  )
);

-- Users can update files in facilities bucket for their own facilities
CREATE POLICY "Users can update facility files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'facilities' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM facilities WHERE owner_id = auth.uid()
  )
);

-- Users can delete files in facilities bucket for their own facilities
CREATE POLICY "Users can delete facility files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'facilities' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM facilities WHERE owner_id = auth.uid()
  )
);

-- ============================================================================
-- Units Bucket Policies
-- ============================================================================

-- Users can view files in units bucket if they own the facility containing the unit
CREATE POLICY "Users can view unit files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'units' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT u.id::text FROM units u
    INNER JOIN facilities f ON u.facility_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- Users can upload files to units bucket for units in their facilities
CREATE POLICY "Users can upload unit files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'units' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT u.id::text FROM units u
    INNER JOIN facilities f ON u.facility_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- Users can update files in units bucket for units in their facilities
CREATE POLICY "Users can update unit files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'units' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT u.id::text FROM units u
    INNER JOIN facilities f ON u.facility_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- Users can delete files in units bucket for units in their facilities
CREATE POLICY "Users can delete unit files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'units' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT u.id::text FROM units u
    INNER JOIN facilities f ON u.facility_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- ============================================================================
-- Customers Bucket Policies
-- ============================================================================

-- Users can view files in customers bucket if they own the customer
CREATE POLICY "Users can view customer files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customers' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM customers WHERE owner_id = auth.uid()
  )
);

-- Users can upload files to customers bucket for their own customers
CREATE POLICY "Users can upload customer files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customers' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM customers WHERE owner_id = auth.uid()
  )
);

-- Users can update files in customers bucket for their own customers
CREATE POLICY "Users can update customer files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'customers' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM customers WHERE owner_id = auth.uid()
  )
);

-- Users can delete files in customers bucket for their own customers
CREATE POLICY "Users can delete customer files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'customers' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM customers WHERE owner_id = auth.uid()
  )
);

-- ============================================================================
-- Rentals Bucket Policies
-- ============================================================================

-- Users can view files in rentals bucket if they own the rental
CREATE POLICY "Users can view rental files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rentals' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM rentals WHERE owner_id = auth.uid()
  )
);

-- Users can upload files to rentals bucket for their own rentals
CREATE POLICY "Users can upload rental files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rentals' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM rentals WHERE owner_id = auth.uid()
  )
);

-- Users can update files in rentals bucket for their own rentals
CREATE POLICY "Users can update rental files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'rentals' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM rentals WHERE owner_id = auth.uid()
  )
);

-- Users can delete files in rentals bucket for their own rentals
CREATE POLICY "Users can delete rental files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rentals' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM rentals WHERE owner_id = auth.uid()
  )
);

-- ============================================================================
-- Maintenance Bucket Policies
-- ============================================================================

-- Users can view files in maintenance bucket if they own the facility
CREATE POLICY "Users can view maintenance files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'maintenance' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT mr.id::text FROM maintenance_requests mr
    INNER JOIN facilities f ON mr.facility_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- Users can upload files to maintenance bucket for their facilities
CREATE POLICY "Users can upload maintenance files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'maintenance' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT mr.id::text FROM maintenance_requests mr
    INNER JOIN facilities f ON mr.facility_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- Users can update files in maintenance bucket for their facilities
CREATE POLICY "Users can update maintenance files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'maintenance' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT mr.id::text FROM maintenance_requests mr
    INNER JOIN facilities f ON mr.facility_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- Users can delete files in maintenance bucket for their facilities
CREATE POLICY "Users can delete maintenance files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'maintenance' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT mr.id::text FROM maintenance_requests mr
    INNER JOIN facilities f ON mr.facility_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- ============================================================================
-- Avatars Bucket Policies
-- ============================================================================

-- Users can view avatars (public bucket - all authenticated users can view)
CREATE POLICY "Users can view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Users can upload their own avatar
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

