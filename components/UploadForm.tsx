'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, ImageIcon } from 'lucide-react';
import { UploadSchema } from '@/lib/zod';
import { BookUploadFormValues } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VoiceSelector from './VoiceSelector';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import { useRouter } from 'next/navigation';
import { parsePDFFile } from '@/lib/utils';
import { upload } from '@vercel/blob/client';
import FileUploader from './FileUploader';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPES } from '@/lib/constant';
import LoadingOverlay from './LoadingOverlay';
import { checkBookExists, createBook, saveBookSegments } from '@/lib/actions/book.actions';

const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const { userId } = useAuth();
    const router = useRouter();

    useEffect(() => setIsMounted(true), []);

    const form = useForm<BookUploadFormValues>({
        resolver: zodResolver(UploadSchema),
        defaultValues: {
            title: '',
            author: '',
            persona: '',
            pdfFile: undefined,
            coverImage: undefined,
        },
    });

    const { control, handleSubmit, reset } = form;

    const onSubmit = async (data: BookUploadFormValues) => {
        if (!userId) {
            toast.error('Please login to upload books');
            return;
        }

        setIsSubmitting(true);

        try {
            const existsCheck = await checkBookExists(data.title);

            if (existsCheck.exists && existsCheck.book) {
                toast.info('Book with same title already exists.');
                reset();
                router.push(`/books/${existsCheck.book.slug}`);
                return;
            }

            const fileTitle = data.title.replace(/\s+/g, '-').toLowerCase();
            const pdfFile = data.pdfFile;

            const parsedPDF = await parsePDFFile(pdfFile);

            if (!parsedPDF.content.length) {
                toast.error('Failed to parse PDF.');
                return;
            }

            const uploadedPdf = await upload(fileTitle, pdfFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
                contentType: 'application/pdf',
            });

            let coverUrl: string;

            if (data.coverImage) {
                const uploadedCover = await upload(
                    `${fileTitle}_cover.png`,
                    data.coverImage,
                    {
                        access: 'public',
                        handleUploadUrl: '/api/upload',
                        contentType: data.coverImage.type,
                    }
                );

                coverUrl = uploadedCover.url;
            } else {
                const response = await fetch(parsedPDF.cover);
                const blob = await response.blob();

                const uploadedCover = await upload(
                    `${fileTitle}_cover.png`,
                    blob,
                    {
                        access: 'public',
                        handleUploadUrl: '/api/upload',
                        contentType: 'image/png',
                    }
                );

                coverUrl = uploadedCover.url;
            }

            const book = await createBook({
                clerkId: userId,
                title: data.title,
                author: data.author,
                persona: data.persona,
                fileURL: uploadedPdf.url,
                fileBlobKey: uploadedPdf.pathname,
                coverURL: coverUrl,
                fileSize: pdfFile.size,
            });

            if (!book.success) {
                // toast.error(book.error || 'Failed to create book');

                if (book.isBillingError) {
                    router.push('/subscriptions');
                }
                return;
            }

            if (book.alreadyExists) {
                toast.info('Book already exists.');
                reset();
                router.push(`/books/${book.data.slug}`);
                return;
            }

            const segments = await saveBookSegments(
                book.data._id,
                userId,
                parsedPDF.content
            );

            if (!segments.success) {
                toast.error('Failed to save book segments');
                throw new Error('Segment save failed');
            }

            reset();
            router.push('/');
        } catch (error) {
            console.error(error);
            toast.error('Upload failed. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    return (
        <>
            {isSubmitting && <LoadingOverlay />}

            <div className="new-book-wrapper">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* PDF Upload */}
                    <FileUploader
                        control={control}
                        name="pdfFile"
                        label="Book PDF File"
                        acceptTypes={ACCEPTED_PDF_TYPES}
                        icon={Upload}
                        placeholder="Click to upload PDF"
                        hint="PDF file (max 50MB)"
                        disabled={isSubmitting}
                    />

                    {/* Cover Upload */}
                    <FileUploader
                        control={control}
                        name="coverImage"
                        label="Cover Image (Optional)"
                        acceptTypes={ACCEPTED_IMAGE_TYPES}
                        icon={ImageIcon}
                        placeholder="Click to upload cover image"
                        hint="Auto-generated if empty"
                        disabled={isSubmitting}
                    />

                    {/* Title */}
                    <Controller
                        control={control}
                        name="title"
                        render={({ field, fieldState }) => (
                            <div className="space-y-1">
                                <label className="form-label">Title</label>
                                <Input
                                    {...field}
                                    placeholder="ex: Rich Dad Poor Dad"
                                    disabled={isSubmitting}
                                />
                                {fieldState.error && (
                                    <p className="text-xs text-red-500">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    {/* Author */}
                    <Controller
                        control={control}
                        name="author"
                        render={({ field, fieldState }) => (
                            <div className="space-y-1">
                                <label className="form-label">Author</label>
                                <Input
                                    {...field}
                                    placeholder="ex: Robert Kiyosaki"
                                    disabled={isSubmitting}
                                />
                                {fieldState.error && (
                                    <p className="text-xs text-red-500">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    {/* Voice */}
                    <Controller
                        control={control}
                        name="persona"
                        render={({ field }) => (
                            <div className="space-y-1">
                                <label className="form-label">
                                    Choose Assistant Voice
                                </label>
                                <VoiceSelector
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}
                    />

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="form-btn"
                        disabled={isSubmitting}
                    >
                        Begin Synthesis
                    </Button>
                </form>
            </div>
        </>
    );
};

export default UploadForm;