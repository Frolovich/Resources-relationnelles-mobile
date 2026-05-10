<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260430093757 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE comments CHANGE date date DATETIME NOT NULL');
        $this->addSql('ALTER TABLE comments RENAME INDEX idx_comment_user TO IDX_5F9E962AA76ED395');
        $this->addSql('ALTER TABLE comments RENAME INDEX idx_comment_resource TO IDX_5F9E962A89329D25');
        $this->addSql('ALTER TABLE resources CHANGE date_creation date_creation DATETIME NOT NULL');
        $this->addSql('ALTER TABLE resources RENAME INDEX idx_user_id TO IDX_EF66EBAEA76ED395');
        $this->addSql('ALTER TABLE resources RENAME INDEX idx_category_id TO IDX_EF66EBAE12469DE2');
        $this->addSql('ALTER TABLE statistiques CHANGE date_creation date_creation DATETIME NOT NULL');
        $this->addSql('ALTER TABLE statistiques RENAME INDEX uniq_resource_id TO UNIQ_B31AB06689329D25');
        $this->addSql('ALTER TABLE users CHANGE registered_at registered_at DATETIME NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE comments CHANGE date date DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE comments RENAME INDEX idx_5f9e962aa76ed395 TO IDX_comment_user');
        $this->addSql('ALTER TABLE comments RENAME INDEX idx_5f9e962a89329d25 TO IDX_comment_resource');
        $this->addSql('ALTER TABLE resources CHANGE date_creation date_creation DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE resources RENAME INDEX idx_ef66ebaea76ed395 TO IDX_user_id');
        $this->addSql('ALTER TABLE resources RENAME INDEX idx_ef66ebae12469de2 TO IDX_category_id');
        $this->addSql('ALTER TABLE statistiques CHANGE date_creation date_creation DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE statistiques RENAME INDEX uniq_b31ab06689329d25 TO UNIQ_resource_id');
        $this->addSql('ALTER TABLE users CHANGE registered_at registered_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
    }
}
