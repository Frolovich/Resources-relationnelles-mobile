<?php

namespace App\Repository;

use App\Entity\Favorite;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repository : accède à la base de données pour l'entité Favorite.
 * Toutes les requêtes SQL liées aux favoris passent par ici.
 *
 * @extends ServiceEntityRepository<Favorite>
 */
class FavoriteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Favorite::class);
    }

    /**
     * Retourne tous les favoris d'un utilisateur avec les données de la ressource associée.
     *
     * @return Favorite[]
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('f')
            ->join('f.resource', 'r')
            ->where('f.user = :user')
            ->andWhere('r.deletedAt IS NULL')
            ->setParameter('user', $user)
            ->orderBy('f.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Vérifie si une ressource est déjà en favori pour un utilisateur.
     */
    public function isAlreadyFavorite(User $user, int $resourceId): bool
    {
        return (bool) $this->createQueryBuilder('f')
            ->select('COUNT(f.id)')
            ->join('f.resource', 'r')
            ->where('f.user = :user')
            ->andWhere('r.id = :resourceId')
            ->setParameter('user', $user)
            ->setParameter('resourceId', $resourceId)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
