<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260503134452 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE favorites (id INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, user_id VARCHAR(36) NOT NULL, resource_id INT NOT NULL, INDEX IDX_E46960F5A76ED395 (user_id), INDEX IDX_E46960F589329D25 (resource_id), UNIQUE INDEX UNIQ_USER_RESOURCE (user_id, resource_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE moderation_logs (id INT AUTO_INCREMENT NOT NULL, action VARCHAR(50) NOT NULL, reason LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, moderator_id VARCHAR(36) NOT NULL, resource_id INT DEFAULT NULL, comment_id INT DEFAULT NULL, target_user_id VARCHAR(36) DEFAULT NULL, INDEX IDX_13191A4ED0AFA354 (moderator_id), INDEX IDX_13191A4E89329D25 (resource_id), INDEX IDX_13191A4EF8697D13 (comment_id), INDEX IDX_13191A4E6C066AFE (target_user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reports (id INT AUTO_INCREMENT NOT NULL, reason LONGTEXT NOT NULL, status VARCHAR(20) DEFAULT \'pending\' NOT NULL, created_at DATETIME NOT NULL, resolved_at DATETIME DEFAULT NULL, reporter_id VARCHAR(36) NOT NULL, reported_user_id VARCHAR(36) DEFAULT NULL, resource_id INT DEFAULT NULL, comment_id INT DEFAULT NULL, INDEX IDX_F11FA745E1CFE6F5 (reporter_id), INDEX IDX_F11FA745E7566E (reported_user_id), INDEX IDX_F11FA74589329D25 (resource_id), INDEX IDX_F11FA745F8697D13 (comment_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user_resource_progress (id INT AUTO_INCREMENT NOT NULL, progress INT DEFAULT 0 NOT NULL, exploited TINYINT DEFAULT 0 NOT NULL, exploited_at DATETIME DEFAULT NULL, updated_at DATETIME NOT NULL, user_id VARCHAR(36) NOT NULL, resource_id INT NOT NULL, INDEX IDX_749283C0A76ED395 (user_id), INDEX IDX_749283C089329D25 (resource_id), UNIQUE INDEX UNIQ_USER_RESOURCE_PROGRESS (user_id, resource_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE favorites ADD CONSTRAINT FK_E46960F5A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE favorites ADD CONSTRAINT FK_E46960F589329D25 FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE moderation_logs ADD CONSTRAINT FK_13191A4ED0AFA354 FOREIGN KEY (moderator_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE moderation_logs ADD CONSTRAINT FK_13191A4E89329D25 FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE moderation_logs ADD CONSTRAINT FK_13191A4EF8697D13 FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE moderation_logs ADD CONSTRAINT FK_13191A4E6C066AFE FOREIGN KEY (target_user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE reports ADD CONSTRAINT FK_F11FA745E1CFE6F5 FOREIGN KEY (reporter_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE reports ADD CONSTRAINT FK_F11FA745E7566E FOREIGN KEY (reported_user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE reports ADD CONSTRAINT FK_F11FA74589329D25 FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE reports ADD CONSTRAINT FK_F11FA745F8697D13 FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE user_resource_progress ADD CONSTRAINT FK_749283C0A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user_resource_progress ADD CONSTRAINT FK_749283C089329D25 FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE favorites DROP FOREIGN KEY FK_E46960F5A76ED395');
        $this->addSql('ALTER TABLE favorites DROP FOREIGN KEY FK_E46960F589329D25');
        $this->addSql('ALTER TABLE moderation_logs DROP FOREIGN KEY FK_13191A4ED0AFA354');
        $this->addSql('ALTER TABLE moderation_logs DROP FOREIGN KEY FK_13191A4E89329D25');
        $this->addSql('ALTER TABLE moderation_logs DROP FOREIGN KEY FK_13191A4EF8697D13');
        $this->addSql('ALTER TABLE moderation_logs DROP FOREIGN KEY FK_13191A4E6C066AFE');
        $this->addSql('ALTER TABLE reports DROP FOREIGN KEY FK_F11FA745E1CFE6F5');
        $this->addSql('ALTER TABLE reports DROP FOREIGN KEY FK_F11FA745E7566E');
        $this->addSql('ALTER TABLE reports DROP FOREIGN KEY FK_F11FA74589329D25');
        $this->addSql('ALTER TABLE reports DROP FOREIGN KEY FK_F11FA745F8697D13');
        $this->addSql('ALTER TABLE user_resource_progress DROP FOREIGN KEY FK_749283C0A76ED395');
        $this->addSql('ALTER TABLE user_resource_progress DROP FOREIGN KEY FK_749283C089329D25');
        $this->addSql('DROP TABLE favorites');
        $this->addSql('DROP TABLE moderation_logs');
        $this->addSql('DROP TABLE reports');
        $this->addSql('DROP TABLE user_resource_progress');
    }
}
