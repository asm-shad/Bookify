'use client';

import React, { useCallback, useRef } from 'react';
import { useController, FieldValues } from 'react-hook-form';
import { X } from 'lucide-react';
import { FileUploadFieldProps } from '@/types';
import { cn } from '@/lib/utils';

const FileUploader = <T extends FieldValues>({
    control,
    name,
    label,
    acceptTypes,
    disabled,
    icon: Icon,
    placeholder,
    hint,
}: FileUploadFieldProps<T>) => {
    const {
        field: { onChange, value },
        fieldState,
    } = useController({ name, control });

    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                onChange(file);
            }
        },
        [onChange]
    );

    const onRemove = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onChange(null);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [onChange]
    );

    const isUploaded = !!value;

    return (
        <div className="w-full space-y-2">
            {/* Label */}
            <label className="text-sm font-medium text-gray-700">
                {label}
            </label>

            {/* Dropzone */}
            <div
                className={cn(
                    'relative flex flex-col items-center justify-center cursor-pointer rounded-md border-2 border-dashed p-6 transition',
                    'border-[#8B7355]/20 hover:border-[#8B7355]/40',
                    isUploaded && 'bg-muted/40',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                <input
                    type="file"
                    accept={acceptTypes.join(',')}
                    className="hidden"
                    ref={inputRef}
                    onChange={handleFileChange}
                    disabled={disabled}
                />

                {isUploaded ? (
                    <div className="flex w-full items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                            {(value as File).name}
                        </p>

                        <button
                            type="button"
                            onClick={onRemove}
                            className="rounded-full p-1 hover:bg-gray-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <Icon className="h-6 w-6 text-gray-500" />
                        <p className="mt-2 text-sm font-medium">
                            {placeholder}
                        </p>
                        <p className="text-xs text-gray-500">{hint}</p>
                    </div>
                )}
            </div>

            {/* Error message (modern replacement for FormMessage) */}
            {fieldState.error && (
                <p className="text-xs text-red-500">
                    {fieldState.error.message}
                </p>
            )}
        </div>
    );
};

export default FileUploader;