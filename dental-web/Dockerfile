# ============================================================
# Sunrise Dental Clinic - Backend (Jakarta EE WAR) Dockerfile
# ============================================================
# Multi-stage build:
#   GitHub repo
#     -> Maven build stage (compiles dental-web-1.0-SNAPSHOT.war)
#     -> Payara Jakarta EE runtime (deploys the WAR)
#
# Deploy on Railway: create a project from this repo, set the service
# root directory to "dental-web", then add DB_URL / DB_USER / DB_PASS
# (and optionally RESEND_*) under the service's Variables tab.

# ---------- Stage 1 : build the WAR ----------
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# ---------- Stage 2 : Jakarta EE runtime ----------
FROM payara/micro:latest

# Deploy the WAR into Payara's auto-deploy directory ($DEPLOY_DIR is a
# predefined variable in Payara images).
COPY --from=build /app/target/dental-web-1.0-SNAPSHOT.war $DEPLOY_DIR/dental-web.war

# Payara Micro uses port 8080 for HTTP.
EXPOSE 8080