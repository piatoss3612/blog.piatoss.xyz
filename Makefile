.PHONY: dev
dev:
	@echo "Starting development server..."
	@npm run dev

.PHONY: build
build:
	@echo "Building..."
	@npm run build

# 사용법: make sync did=<blog_distribution_id>
# distribution id는 piatoss.xyz/terraform에서 `terraform output blog_distribution_id`
.PHONY: sync
sync:
	@echo "Syncing with s3..."
	@aws s3 sync dist/ s3://blog.piatoss.xyz --delete && aws cloudfront create-invalidation --distribution-id $(did) --paths "/*"

.PHONY: deploy
deploy: build sync
