<?php

namespace App\Service;

use App\Entity\Resource;
use App\Entity\ResourceStatus;
use App\Entity\ResourceType;
use App\Entity\Statistique;
use App\Entity\User;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Service : porte l'intelligence fonctionnelle de l'upload de médias.
 * Validation MIME, taille, déplacement vers NGINX, création de la Resource en base.
 */
class ResourceUploadService
{
    private const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
    private const MAX_IMAGE_SIZE      = 10 * 1024 * 1024;
    private const MAX_VIDEO_SIZE      = 200 * 1024 * 1024;

    public function __construct(
        private EntityManagerInterface $em,
        private CategoryRepository $categoryRepository,
        private string $mediaDir,
    ) {}

    /**
     * @return array{resource: Resource, subFolder: string, filename: string}|array{error: string, code: int}
     */
    public function upload(UploadedFile $file, string $description, ?int $categoryId, bool $restreint, User $user): array
    {
        if (!$file->isValid()) {
            return ['error' => 'File upload error.', 'code' => 400];
        }

        $mimeType = $file->getMimeType();
        $isImage  = in_array($mimeType, self::ALLOWED_IMAGE_TYPES);
        $isVideo  = in_array($mimeType, self::ALLOWED_VIDEO_TYPES);

        if (!$isImage && !$isVideo) {
            return ['error' => 'File type not allowed. Accepted: jpg, png, webp, gif, mp4, webm, ogg.', 'code' => 400];
        }

        $maxSize = $isImage ? self::MAX_IMAGE_SIZE : self::MAX_VIDEO_SIZE;
        if ($file->getSize() > $maxSize) {
            return ['error' => 'File too large. Max: ' . ($maxSize / 1024 / 1024) . 'MB.', 'code' => 400];
        }

        $category = $categoryId ? $this->categoryRepository->find($categoryId) : null;
        if (!$category) {
            return ['error' => 'Invalid category.', 'code' => 400];
        }

        $subFolder = $isImage ? 'images' : 'videos';
        $targetDir = $this->mediaDir . DIRECTORY_SEPARATOR . $subFolder;
        $filename  = uniqid('media_', true) . '.' . $file->guessExtension();

        if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
            return ['error' => 'Cannot create media directory: ' . $targetDir, 'code' => 500];
        }

        try {
            $file->move($targetDir, $filename);
        } catch (\Exception $e) {
            return ['error' => 'Failed to save file: ' . $e->getMessage(), 'code' => 500];
        }

        try {
            $resource = new Resource();
            $resource->setUser($user);
            $resource->setCategory($category);
            $resource->setDescription($description);
            $resource->setContent($filename);
            $resource->setType($isImage ? ResourceType::PHOTO : ResourceType::VIDEO);
            $resource->setStatus(ResourceStatus::PENDING);
            $resource->setRestreint($restreint);

            $statistique = new Statistique();
            $statistique->setResource($resource);
            $resource->setStatistique($statistique);

            $this->em->persist($resource);
            $this->em->persist($statistique);
            $this->em->flush();
        } catch (\Exception $e) {
            return ['error' => 'Database error: ' . $e->getMessage(), 'code' => 500];
        }

        return ['resource' => $resource, 'subFolder' => $subFolder, 'filename' => $filename];
    }
}
