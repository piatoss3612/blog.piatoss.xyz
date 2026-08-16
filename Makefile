.PHONY: dev
dev:
	@echo "Starting development server..."
	@npm run dev

.PHONY: build
build:
	@echo "Building..."
	@npm run build

# 배포 타깃은 없다. main에 푸시하면 .github/workflows/deploy.yml이 빌드해서 올린다.
# 로컬에서 결과물을 보려면 make build 후 npm run preview.
