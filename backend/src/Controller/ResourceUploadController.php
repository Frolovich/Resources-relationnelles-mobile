<?php

namespace App\Controller;

use App\Entity\Resource;
use App\Entity\ResourceStatus;
use App\Entity\ResourceType;
use App\Entity\Statistique;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

class ResourceUploadController extends AbstractController
{
    private string $projectDir;
    private string $mediaDir;

    public function __construct(string $projectDir, string $mediaDir)
    {
        $this->projectDir = $projectDir;
        $this->mediaDir = $mediaDir;
    }
    // Types MIME autorisés
    private const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
    private const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
    private const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

    #[Route('/api/resources/upload', name: 'api_resource_upload', methods: ['POST'])]
    public function upload(
        Request $request,
        #[CurrentUser] ?User $user,
        EntityManagerInterface $em,
        CategoryRepository $categoryRepository
    ): JsonResponse {
        if (!$user) {
            return $this->json(['error' => 'Not authenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $file        = $request->files->get('file');
        $description = $request->request->get('description', '');
        $categoryId  = $request->request->get('category_id');
        $restreint   = $request->request->get('restreint', false);

        // Validation fichier
        if (!$file) {
            return $this->json(['error' => 'No file provided.'], Response::HTTP_BAD_REQUEST);
        }

        if (!$file->isValid()) {
            return $this->json(['error' => 'File upload error.'], Response::HTTP_BAD_REQUEST);
        }

        $mimeType = $file->getMimeType();
        $isImage  = in_array($mimeType, self::ALLOWED_IMAGE_TYPES);
        $isVideo  = in_array($mimeType, self::ALLOWED_VIDEO_TYPES);

        if (!$isImage && !$isVideo) {
            return $this->json([
                'error' => 'File type not allowed. Accepted: jpg, png, webp, gif, mp4, webm, ogg.'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation taille
        $maxSize = $isImage ? self::MAX_IMAGE_SIZE : self::MAX_VIDEO_SIZE;
        if ($file->getSize() > $maxSize) {
            $maxMb = $maxSize / 1024 / 1024;
            return $this->json(['error' => "File too large. Max: {$maxMb}MB."], Response::HTTP_BAD_REQUEST);
        }

        // Validation catégorie
        $category = $categoryId ? $categoryRepository->find($categoryId) : null;
        if (!$category) {
            return $this->json(['error' => 'Invalid category.'], Response::HTTP_BAD_REQUEST);
        }

        // Générer un nom de fichier unique
        $extension = $file->guessExtension();
        $filename  = uniqid('media_', true) . '.' . $extension;

        // Chemin de destination sur le serveur NGINX
        $subFolder = $isImage ? 'images' : 'videos';
        $targetDir = $this->mediaDir . DIRECTORY_SEPARATOR . $subFolder;

        // Créer le dossier si nécessaire
        if (!is_dir($targetDir)) {
            if (!mkdir($targetDir, 0755, true)) {
                return $this->json(['error' => 'Cannot create media directory: ' . $targetDir], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }

        // Déplacer le fichier
        try {
            $file->move($targetDir, $filename);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to save file: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        // Créer l'entité Resource
        try {
            $resource = new Resource();
            $resource->setUser($user);
            $resource->setCategory($category);
            $resource->setDescription($description);
            $resource->setContent($filename);
            $resource->setType($isImage ? ResourceType::PHOTO : ResourceType::VIDEO);
            $resource->setStatus(ResourceStatus::PENDING);
            $resource->setRestreint((bool) $restreint);

            $statistique = new Statistique();
            $statistique->setResource($resource);
            $resource->setStatistique($statistique);

            $em->persist($resource);
            $em->persist($statistique);
            $em->flush();
        } catch (\Exception $e) {
            return $this->json(['error' => 'Database error: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        // URL publique via NGINX
        $publicUrl = "http://localhost:8080/{$subFolder}/{$filename}";

        return $this->json([
            'message'    => 'Resource uploaded successfully.',
            'resource'   => [
                'id'          => $resource->getId(),
                'type'        => $resource->getType()->value,
                'status'      => $resource->getStatus()->value,
                'filename'    => $filename,
                'url'         => $publicUrl,
                'description' => $resource->getDescription(),
                'category'    => $category->getName(),
                'uploadedAt'  => $resource->getDateCreation()->format('Y-m-d H:i:s'),
            ],
        ], Response::HTTP_CREATED);
    }
}
