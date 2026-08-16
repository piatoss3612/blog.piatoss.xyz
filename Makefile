.PHONY: dev
dev:
	@echo "Starting development server..."
	@npm run dev

.PHONY: build
build:
	@echo "Building..."
	@npm run build

# 웹폰트 서브셋을 다시 만든다. 빌드가 "서브셋에 없는 글자" 경고를 뱉을 때 돌리면 된다.
.PHONY: fonts
fonts:
	@npm run fonts

# 배포 타깃은 없다. main에 푸시하면 .github/workflows/deploy.yml이 빌드해서 올린다.
# 로컬에서 결과물을 보려면 make build 후 npm run preview.
