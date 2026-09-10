import logging
from typing import Optional
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")


class MongoDBManager:
    """
    Manages MongoDB client lifecycle, database connection, and collection accessors.
    Target database: ideal_skillsetdb
    Collections: User_data, Signup_otps, Resumes, Jobs, ATS_results, Skill_gaps, Roadmaps, Readiness, Skills, Assessments, Interviews
    """
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        self.is_connected: bool = False

    def connect(self) -> Optional[Database]:
        """
        Initializes PyMongo client and connects to the configured database.
        Handles connection errors gracefully without crashing the API server.
        """
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            self.client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000
            )
            # Trigger quick server ping to test connectivity
            self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            logger.info(f"Successfully connected to MongoDB database: '{settings.DATABASE_NAME}'")

            # Ensure required indexes on collections
            self._init_indexes()

            return self.db
        except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
            self.is_connected = False
            self.db = None
            logger.warning(
                f"MongoDB connection failed: {exc}. "
                "The server will continue running with in-memory fallbacks until MongoDB is available."
            )
            return None
        except Exception as exc:
            self.is_connected = False
            self.db = None
            logger.error(f"Unexpected MongoDB error during initialization: {exc}")
            return None

    def _init_indexes(self):
        """
        Safely creates required indexes in MongoDB collections without overwriting existing data.
        """
        if self.db is not None:
            # 1. Unique index on User_data.email
            try:
                user_col = self.db["User_data"]
                user_col.create_index("email", unique=True, name="idx_user_email_unique")
                logger.info("Verified unique index on User_data.email")
            except Exception as e:
                logger.warning(f"Note on User_data index creation: {e}")

            # 2. Indexes on Signup_otps (email, and TTL on expires_at)
            try:
                otp_col = self.db["Signup_otps"]
                otp_col.create_index("email", name="idx_signup_otps_email")
                # MongoDB TTL index to automatically purge expired OTP documents
                otp_col.create_index("expires_at", expireAfterSeconds=0, name="idx_signup_otps_ttl")
                logger.info("Verified email index and TTL expiration index on Signup_otps")
            except Exception as e:
                logger.warning(f"Note on Signup_otps index creation: {e}")

            # 3. Compound index on Resumes (user_id, uploaded_at DESC)
            try:
                resumes_col = self.db["Resumes"]
                resumes_col.create_index(
                    [("user_id", ASCENDING), ("uploaded_at", DESCENDING)],
                    name="idx_resumes_user_uploaded"
                )
                logger.info("Verified compound index on Resumes(user_id, uploaded_at)")
            except Exception as e:
                logger.warning(f"Note on Resumes index creation: {e}")

            # 4. Compound index on Jobs (user_id, created_at DESC)
            try:
                jobs_col = self.db["Jobs"]
                jobs_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_jobs_user_created"
                )
                logger.info("Verified compound index on Jobs(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on Jobs index creation: {e}")

            # 5. Compound index on ATS_results (user_id, created_at DESC)
            try:
                ats_col = self.db["ATS_results"]
                ats_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_ats_user_created"
                )
                logger.info("Verified compound index on ATS_results(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on ATS_results index creation: {e}")

            # 6. Compound index on Skill_gaps (user_id, created_at DESC)
            try:
                sg_col = self.db["Skill_gaps"]
                sg_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_skill_gaps_user_created"
                )
                logger.info("Verified compound index on Skill_gaps(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on Skill_gaps index creation: {e}")

            # 7. Compound index on Roadmaps (user_id, created_at DESC)
            try:
                rm_col = self.db["Roadmaps"]
                rm_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_roadmaps_user_created"
                )
                logger.info("Verified compound index on Roadmaps(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on Roadmaps index creation: {e}")

            # 8. Compound index on Readiness (user_id, created_at DESC)
            try:
                rd_col = self.db["Readiness"]
                rd_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_readiness_user_created"
                )
                logger.info("Verified compound index on Readiness(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on Readiness index creation: {e}")

            # 9. Compound index on Admin_audit_logs (admin_id, timestamp DESC)
            try:
                audit_col = self.db["Admin_audit_logs"]
                audit_col.create_index(
                    [("admin_id", ASCENDING), ("timestamp", DESCENDING)],
                    name="idx_admin_audit_logs"
                )
                logger.info("Verified compound index on Admin_audit_logs(admin_id, timestamp)")
            except Exception as e:
                logger.warning(f"Note on Admin_audit_logs index creation: {e}")

            # 10. Recruiter System Collections Indexes
            try:
                # Companies
                comp_col = self.db["Companies"]
                comp_col.create_index("name", name="idx_companies_name")
                comp_col.create_index("created_by", name="idx_companies_created_by")

                # Candidate_applications
                apps_col = self.db["Candidate_applications"]
                apps_col.create_index([("job_id", ASCENDING), ("candidate_user_id", ASCENDING)], name="idx_applications_job_cand")
                apps_col.create_index([("company_id", ASCENDING), ("current_stage", ASCENDING)], name="idx_applications_comp_stage")
                apps_col.create_index([("recruiter_id", ASCENDING), ("created_at", DESCENDING)], name="idx_applications_rec_created")

                # Candidate_evaluations
                eval_col = self.db["Candidate_evaluations"]
                eval_col.create_index([("candidate_id", ASCENDING), ("job_id", ASCENDING)], name="idx_evaluations_cand_job")
                eval_col.create_index([("overall_fit", DESCENDING)], name="idx_evaluations_overall_fit")

                # Skill_verifications
                sv_col = self.db["Skill_verifications"]
                sv_col.create_index([("candidate_id", ASCENDING), ("job_id", ASCENDING), ("skill", ASCENDING)], name="idx_sv_cand_job_skill")

                # Hiring_decisions
                hd_col = self.db["Hiring_decisions"]
                hd_col.create_index([("job_id", ASCENDING), ("candidate_id", ASCENDING)], name="idx_hd_job_cand")

                # Recruiter_activity
                act_col = self.db["Recruiter_activity"]
                act_col.create_index([("recruiter_id", ASCENDING), ("created_at", DESCENDING)], name="idx_rec_activity_rec_created")
                act_col.create_index([("company_id", ASCENDING), ("created_at", DESCENDING)], name="idx_rec_activity_comp_created")

                logger.info("Verified indexes for Recruiter AI Hiring Copilot collections")
            except Exception as e:
                logger.warning(f"Note on Recruiter collections index creation: {e}")

    def close(self):
        """
        Cleanly closes the MongoDB connection pool.
        """
        if self.client:
            logger.info("Closing MongoDB connection...")
            self.client.close()
            self.is_connected = False
            self.db = None
            logger.info("MongoDB connection closed.")

    def get_database(self) -> Optional[Database]:
        """
        Returns the active MongoDB database instance.
        """
        return self.db

    def get_collection(self, name: str) -> Optional[Collection]:
        if self.db is not None:
            return self.db[name]
        return None

    # Primary Collections
    @property
    def user_data(self) -> Optional[Collection]:
        return self.get_collection("User_data")

    @property
    def User_data(self) -> Optional[Collection]:
        return self.get_collection("User_data")

    @property
    def users(self) -> Optional[Collection]:
        return self.get_collection("User_data")

    @property
    def signup_otps(self) -> Optional[Collection]:
        return self.get_collection("Signup_otps")

    @property
    def Signup_otps(self) -> Optional[Collection]:
        return self.get_collection("Signup_otps")

    @property
    def resumes(self) -> Optional[Collection]:
        return self.get_collection("Resumes")

    @property
    def Resumes(self) -> Optional[Collection]:
        return self.get_collection("Resumes")

    @property
    def jobs(self) -> Optional[Collection]:
        return self.get_collection("Jobs")

    @property
    def Jobs(self) -> Optional[Collection]:
        return self.get_collection("Jobs")

    @property
    def ats_results(self) -> Optional[Collection]:
        return self.get_collection("ATS_results")

    @property
    def ATS_results(self) -> Optional[Collection]:
        return self.get_collection("ATS_results")

    @property
    def skill_gaps(self) -> Optional[Collection]:
        return self.get_collection("Skill_gaps")

    @property
    def Skill_gaps(self) -> Optional[Collection]:
        return self.get_collection("Skill_gaps")

    @property
    def roadmaps(self) -> Optional[Collection]:
        return self.get_collection("Roadmaps")

    @property
    def Roadmaps(self) -> Optional[Collection]:
        return self.get_collection("Roadmaps")

    @property
    def readiness(self) -> Optional[Collection]:
        return self.get_collection("Readiness")

    @property
    def Readiness(self) -> Optional[Collection]:
        return self.get_collection("Readiness")

    @property
    def skills(self) -> Optional[Collection]:
        return self.get_collection("Skills")

    @property
    def assessments(self) -> Optional[Collection]:
        return self.get_collection("Assessments")

    @property
    def assessment_results(self) -> Optional[Collection]:
        return self.get_collection("Assessment_results")

    @property
    def Assessment_results(self) -> Optional[Collection]:
        return self.get_collection("Assessment_results")

    @property
    def interviews(self) -> Optional[Collection]:
        return self.get_collection("Interviews")

    @property
    def interview_results(self) -> Optional[Collection]:
        return self.get_collection("Interview_results")

    @property
    def Interview_results(self) -> Optional[Collection]:
        return self.get_collection("Interview_results")

    @property
    def admin_audit_logs(self) -> Optional[Collection]:
        return self.get_collection("Admin_audit_logs")

    @property
    def Admin_audit_logs(self) -> Optional[Collection]:
        return self.get_collection("Admin_audit_logs")

    @property
    def admin_notifications(self) -> Optional[Collection]:
        return self.get_collection("Admin_notifications")

    @property
    def Admin_notifications(self) -> Optional[Collection]:
        return self.get_collection("Admin_notifications")

    # Recruiter System Collections
    @property
    def companies(self) -> Optional[Collection]:
        return self.get_collection("Companies")

    @property
    def Companies(self) -> Optional[Collection]:
        return self.get_collection("Companies")

    @property
    def recruiter_profiles(self) -> Optional[Collection]:
        return self.get_collection("Recruiter_profiles")

    @property
    def Recruiter_profiles(self) -> Optional[Collection]:
        return self.get_collection("Recruiter_profiles")

    @property
    def candidate_applications(self) -> Optional[Collection]:
        return self.get_collection("Candidate_applications")

    @property
    def Candidate_applications(self) -> Optional[Collection]:
        return self.get_collection("Candidate_applications")

    @property
    def candidate_evaluations(self) -> Optional[Collection]:
        return self.get_collection("Candidate_evaluations")

    @property
    def Candidate_evaluations(self) -> Optional[Collection]:
        return self.get_collection("Candidate_evaluations")

    @property
    def skill_verifications(self) -> Optional[Collection]:
        return self.get_collection("Skill_verifications")

    @property
    def Skill_verifications(self) -> Optional[Collection]:
        return self.get_collection("Skill_verifications")

    @property
    def hiring_decisions(self) -> Optional[Collection]:
        return self.get_collection("Hiring_decisions")

    @property
    def Hiring_decisions(self) -> Optional[Collection]:
        return self.get_collection("Hiring_decisions")

    @property
    def recruiter_activity(self) -> Optional[Collection]:
        return self.get_collection("Recruiter_activity")

    @property
    def Recruiter_activity(self) -> Optional[Collection]:
        return self.get_collection("Recruiter_activity")


# Global database manager instance
mongo_manager = MongoDBManager()


def get_db() -> Optional[Database]:
    """
    Dependency or helper to access the active database.
    """
    return mongo_manager.get_database()
