FROM openjdk:17

WORKDIR /usr/src/app

# Copy the sandbox.java file into the container's working directory
COPY pages/api/code/Dockerfiles/Java/sandbox.java .

# Compile and run the Java program
CMD ["sh", "-c", "javac sandbox.java && java sandbox"]
