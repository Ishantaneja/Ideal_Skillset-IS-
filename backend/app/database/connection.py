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
    Collections: User_data, Resumes, Jobs, ATS_results, Skill_gaps, Roadmaps, Readiness, Skills, Assessments, Interviews
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

            # 2. Compound index on Resumes (user_id, uploaded_at DESC)
            try:
                resumes_col = self.db["Resumes"]
                resumes_col.create_index(
                    [("user_id", ASCENDING), ("uploaded_at", DESCENDING)],
                    name="idx_resumes_user_uploaded"
                )
                logger.info("Verified compound index on Resumes(user_id, uploaded_at)")
            except Exception as e:
                logger.warning(f"Note on Resumes index creation: {e}")

            # 3. Compound index on Jobs (user_id, created_at DESC)
            try:
                jobs_col = self.db["Jobs"]
                jobs_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_jobs_user_created"
                )
                logger.info("Verified compound index on Jobs(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on Jobs index creation: {e}")

            # 4. Compound index on ATS_results (user_id, created_at DESC)
            try:
                ats_col = self.db["ATS_results"]
                ats_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_ats_user_created"
                )
                logger.info("Verified compound index on ATS_results(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on ATS_results index creation: {e}")

            # 5. Compound index on Skill_gaps (user_id, created_at DESC)
            try:
                sg_col = self.db["Skill_gaps"]
                sg_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_skill_gaps_user_created"
                )
                logger.info("Verified compound index on Skill_gaps(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on Skill_gaps index creation: {e}")

            # 6. Compound index on Roadmaps (user_id, created_at DESC)
            try:
                rm_col = self.db["Roadmaps"]
                rm_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_roadmaps_user_created"
                )
                logger.info("Verified compound index on Roadmaps(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on Roadmaps index creation: {e}")

            # 7. Compound index on Readiness (user_id, created_at DESC)
            try:
                rd_col = self.db["Readiness"]
                rd_col.create_index(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="idx_readiness_user_created"
                )
                logger.info("Verified compound index on Readiness(user_id, created_at)")
            except Exception as e:
                logger.warning(f"Note on Readiness index creation: {e}")

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
    def interviews(self) -> Optional[Collection]:
        return self.get_collection("Interviews")


# Global database manager instance
mongo_manager = MongoDBManager()


def get_db() -> Optional[Database]:
    """
    Dependency or helper to access the active database.
    """
    return mongo_manager.get_database()
