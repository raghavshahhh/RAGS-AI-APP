#!/bin/bash
npx tsc src/services/local-memory.ts --outDir dist/services --module commonjs --target es2020 --skipLibCheck --esModuleInterop --resolveJsonModule
npx tsc src/services/simple-tts.ts --outDir dist/services --module commonjs --target es2020 --skipLibCheck --esModuleInterop --resolveJsonModule  
npx tsc src/routes/real-ai.ts --outDir dist/routes --module commonjs --target es2020 --skipLibCheck --esModuleInterop --resolveJsonModule
npx tsc src/services/real-ai-integration.ts --outDir dist/services --module commonjs --target es2020 --skipLibCheck --esModuleInterop --resolveJsonModule
