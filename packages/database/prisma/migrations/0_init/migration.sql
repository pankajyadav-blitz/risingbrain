-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('NORMAL', 'STUDENT', 'SUBSCRIBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIALS', 'GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SOLVED');

-- CreateEnum
CREATE TYPE "QuizKind" AS ENUM ('APTITUDE', 'LOGICAL_REASONING', 'PUZZLE');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseTag" AS ENUM ('DSA', 'SQL', 'SYSTEM_DESIGN', 'LLD', 'APTITUDE', 'INTERVIEW', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'ARTICLE', 'QUIZ');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "InterviewVerdict" AS ENUM ('SELECTED', 'REJECTED', 'PENDING');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('DSA_PROBLEM', 'MCQ', 'COURSE_LESSON');

-- CreateEnum
CREATE TYPE "DomainSubject" AS ENUM ('SQL', 'DBMS', 'OS', 'CN', 'OOPS');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'VIEWED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "username" TEXT,
    "phoneNumber" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'NORMAL',
    "disabledAt" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshHash" TEXT NOT NULL,
    "prevRefreshHash" TEXT,
    "prevRefreshExpiresAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" TEXT,
    "externalId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsa_sheets" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dsa_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsa_topics" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dsa_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsa_patterns" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "strategy" TEXT,
    "identification" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dsa_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsa_problems" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reference" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "leetcodeUrl" TEXT,
    "gfgUrl" TEXT,
    "youtubeUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dsa_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_companies" (
    "problemId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "problem_companies_pkey" PRIMARY KEY ("problemId","companyId")
);

-- CreateTable
CREATE TABLE "domain_topics" (
    "id" TEXT NOT NULL,
    "subject" "DomainSubject" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "groupLabel" TEXT NOT NULL,
    "groupOrder" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "notes" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_questions" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answerKey" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" "Difficulty",
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "domain_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_domain_quiz_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedKey" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_domain_quiz_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_domain_topic_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_domain_topic_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_categories" (
    "id" TEXT NOT NULL,
    "kind" "QuizKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_topics" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "theory" TEXT,
    "formula" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answerKey" TEXT NOT NULL,
    "explanation" TEXT,
    "hint" TEXT,
    "difficulty" "Difficulty",
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quiz_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedKey" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "hintUsed" BOOLEAN NOT NULL DEFAULT false,
    "awarded" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quiz_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quiz_topic_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quiz_topic_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT,
    "links" JSONB,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,
    "descriptionLong" TEXT,
    "icon" TEXT,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "tag" "CourseTag" NOT NULL DEFAULT 'DSA',
    "priceInPaise" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION,
    "learnersLabel" TEXT,
    "lessonCount" INTEGER NOT NULL DEFAULT 0,
    "durationHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "instructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LessonType" NOT NULL DEFAULT 'VIDEO',
    "durationLabel" TEXT,
    "videoUrl" TEXT,
    "contentUrl" TEXT,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_experiences" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "verdict" "InterviewVerdict" NOT NULL DEFAULT 'PENDING',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "roundsCount" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "tags" TEXT[],
    "status" "PublishStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_comments" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_problem_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "status" "ProblemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_problem_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_problem_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_problem_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "dsaCount" INTEGER NOT NULL DEFAULT 0,
    "mcqCount" INTEGER NOT NULL DEFAULT 0,
    "courseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "rating" INTEGER,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerAccountId_key" ON "oauth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshHash_key" ON "sessions"("refreshHash");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_prevRefreshHash_key" ON "sessions"("prevRefreshHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_currentPeriodEnd_idx" ON "subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "dsa_sheets_slug_key" ON "dsa_sheets"("slug");

-- CreateIndex
CREATE INDEX "dsa_topics_sheetId_idx" ON "dsa_topics"("sheetId");

-- CreateIndex
CREATE UNIQUE INDEX "dsa_topics_sheetId_slug_key" ON "dsa_topics"("sheetId", "slug");

-- CreateIndex
CREATE INDEX "dsa_patterns_topicId_idx" ON "dsa_patterns"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "dsa_patterns_topicId_slug_key" ON "dsa_patterns"("topicId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "dsa_problems_slug_key" ON "dsa_problems"("slug");

-- CreateIndex
CREATE INDEX "dsa_problems_patternId_idx" ON "dsa_problems"("patternId");

-- CreateIndex
CREATE INDEX "dsa_problems_difficulty_idx" ON "dsa_problems"("difficulty");

-- CreateIndex
CREATE INDEX "problem_companies_companyId_idx" ON "problem_companies"("companyId");

-- CreateIndex
CREATE INDEX "domain_topics_subject_idx" ON "domain_topics"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "domain_topics_subject_slug_key" ON "domain_topics"("subject", "slug");

-- CreateIndex
CREATE INDEX "domain_questions_topicId_idx" ON "domain_questions"("topicId");

-- CreateIndex
CREATE INDEX "user_domain_quiz_progress_userId_idx" ON "user_domain_quiz_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_domain_quiz_progress_userId_questionId_key" ON "user_domain_quiz_progress"("userId", "questionId");

-- CreateIndex
CREATE INDEX "user_domain_topic_scores_userId_idx" ON "user_domain_topic_scores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_domain_topic_scores_userId_topicId_key" ON "user_domain_topic_scores"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_categories_slug_key" ON "quiz_categories"("slug");

-- CreateIndex
CREATE INDEX "quiz_topics_categoryId_idx" ON "quiz_topics"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_topics_categoryId_slug_key" ON "quiz_topics"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "quiz_questions_topicId_idx" ON "quiz_questions"("topicId");

-- CreateIndex
CREATE INDEX "user_quiz_progress_userId_idx" ON "user_quiz_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_quiz_progress_userId_questionId_key" ON "user_quiz_progress"("userId", "questionId");

-- CreateIndex
CREATE INDEX "user_quiz_topic_scores_userId_idx" ON "user_quiz_topic_scores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_quiz_topic_scores_userId_topicId_key" ON "user_quiz_topic_scores"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_slug_key" ON "instructors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_tag_idx" ON "courses"("tag");

-- CreateIndex
CREATE INDEX "courses_isPublished_idx" ON "courses"("isPublished");

-- CreateIndex
CREATE INDEX "course_modules_courseId_idx" ON "course_modules"("courseId");

-- CreateIndex
CREATE INDEX "course_lessons_moduleId_idx" ON "course_lessons"("moduleId");

-- CreateIndex
CREATE INDEX "enrollments_userId_idx" ON "enrollments"("userId");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_courseId_key" ON "enrollments"("userId", "courseId");

-- CreateIndex
CREATE INDEX "lesson_progress_enrollmentId_idx" ON "lesson_progress"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollmentId_lessonId_key" ON "lesson_progress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE INDEX "interview_experiences_status_createdAt_idx" ON "interview_experiences"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "interview_experiences_status_likeCount_createdAt_idx" ON "interview_experiences"("status", "likeCount" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "interview_experiences_status_verdict_createdAt_idx" ON "interview_experiences"("status", "verdict", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "interview_experiences_tags_idx" ON "interview_experiences" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "interview_experiences_authorId_status_idx" ON "interview_experiences"("authorId", "status");

-- CreateIndex
CREATE INDEX "interview_experiences_reviewedById_idx" ON "interview_experiences"("reviewedById");

-- CreateIndex
CREATE INDEX "interview_experiences_company_idx" ON "interview_experiences"("company");

-- CreateIndex
CREATE INDEX "interview_likes_experienceId_isActive_idx" ON "interview_likes"("experienceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "interview_likes_userId_experienceId_key" ON "interview_likes"("userId", "experienceId");

-- CreateIndex
CREATE INDEX "interview_comments_experienceId_idx" ON "interview_comments"("experienceId");

-- CreateIndex
CREATE INDEX "interview_comments_authorId_idx" ON "interview_comments"("authorId");

-- CreateIndex
CREATE INDEX "user_problem_progress_userId_idx" ON "user_problem_progress"("userId");

-- CreateIndex
CREATE INDEX "user_problem_progress_userId_status_idx" ON "user_problem_progress"("userId", "status");

-- CreateIndex
CREATE INDEX "user_problem_progress_userId_isBookmarked_idx" ON "user_problem_progress"("userId", "isBookmarked");

-- CreateIndex
CREATE UNIQUE INDEX "user_problem_progress_userId_problemId_key" ON "user_problem_progress"("userId", "problemId");

-- CreateIndex
CREATE INDEX "user_problem_notes_userId_idx" ON "user_problem_notes"("userId");

-- CreateIndex
CREATE INDEX "user_problem_notes_userId_isActive_idx" ON "user_problem_notes"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "user_problem_notes_userId_problemId_key" ON "user_problem_notes"("userId", "problemId");

-- CreateIndex
CREATE INDEX "submissions_userId_createdAt_idx" ON "submissions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_days_userId_idx" ON "activity_days"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_days_userId_day_key" ON "activity_days"("userId", "day");

-- CreateIndex
CREATE INDEX "feedback_status_createdAt_idx" ON "feedback"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "feedback_userId_status_idx" ON "feedback"("userId", "status");

-- CreateIndex
CREATE INDEX "feedback_reviewedById_idx" ON "feedback"("reviewedById");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_topics" ADD CONSTRAINT "dsa_topics_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "dsa_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_patterns" ADD CONSTRAINT "dsa_patterns_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "dsa_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_problems" ADD CONSTRAINT "dsa_problems_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "dsa_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_companies" ADD CONSTRAINT "problem_companies_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "dsa_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_companies" ADD CONSTRAINT "problem_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_questions" ADD CONSTRAINT "domain_questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "domain_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_domain_quiz_progress" ADD CONSTRAINT "user_domain_quiz_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_domain_quiz_progress" ADD CONSTRAINT "user_domain_quiz_progress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "domain_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_domain_topic_scores" ADD CONSTRAINT "user_domain_topic_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_domain_topic_scores" ADD CONSTRAINT "user_domain_topic_scores_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "domain_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_topics" ADD CONSTRAINT "quiz_topics_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "quiz_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "quiz_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_topic_scores" ADD CONSTRAINT "user_quiz_topic_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_topic_scores" ADD CONSTRAINT "user_quiz_topic_scores_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "quiz_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_experiences" ADD CONSTRAINT "interview_experiences_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_experiences" ADD CONSTRAINT "interview_experiences_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_likes" ADD CONSTRAINT "interview_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_likes" ADD CONSTRAINT "interview_likes_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "interview_experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_comments" ADD CONSTRAINT "interview_comments_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "interview_experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_comments" ADD CONSTRAINT "interview_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_problem_progress" ADD CONSTRAINT "user_problem_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_problem_progress" ADD CONSTRAINT "user_problem_progress_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "dsa_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_problem_notes" ADD CONSTRAINT "user_problem_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_problem_notes" ADD CONSTRAINT "user_problem_notes_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "dsa_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_days" ADD CONSTRAINT "activity_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
