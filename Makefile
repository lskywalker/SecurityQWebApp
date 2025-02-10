BACKEND_DIR=backend
FRONTEND_DIR=frontend

BACKEND_CMD="cd $(BACKEND_DIR) && node index.js"
FRONTEND_CMD="cd $(FRONTEND_DIR) && npm start"

BACKEND_PORT=5001
FRONTEND_PORT=3000

run:
	@echo "Starting backend..."
	@rm -f backend.log frontend.log backend.pid frontend.pid
	@sh -c $(BACKEND_CMD) > backend.log 2>&1 & echo $$! > backend.pid
	@sleep 2
	@if ! ps -p $$(cat backend.pid) > /dev/null 2>&1; then \
		echo "\033[31mBackend failed to start! Check backend.log for details.\033[0m"; \
		rm -f backend.pid; \
		exit 1; \
	fi

	@echo "Starting frontend..."
	@sh -c $(FRONTEND_CMD) > frontend.log 2>&1 & echo $$! > frontend.pid
	@sleep 2
	@if ! ps -p $$(cat frontend.pid) > /dev/null 2>&1; then \
		echo "\033[31mFrontend failed to start! Check frontend.log for details.\033[0m"; \
		rm -f frontend.pid; \
		exit 1; \
	fi

	@echo "\033[32mServers started in the background.\033[0m"

restart: clean run
	@echo "\033[32mRestarted backend and frontend.\033[0m"

clean:
	@echo "Cleaning up processes..."
	@if [ -f backend.pid ]; then \
		kill -9 $$(cat backend.pid) 2>/dev/null || true; \
		rm -f backend.pid; \
	fi
	@if [ -f frontend.pid ]; then \
		kill -9 $$(cat frontend.pid) 2>/dev/null || true; \
		rm -f frontend.pid; \
	fi
	@pkill -9 -f "node index.js" 2>/dev/null || true
	@pkill -9 -f "npm start" 2>/dev/null || true
	@lsof -ti :$(BACKEND_PORT) | xargs kill -9 > /dev/null 2>&1 || true
	@lsof -ti :$(FRONTEND_PORT) | xargs kill -9 > /dev/null 2>&1 || true
	@rm -f backend.log frontend.log
	@echo "\033[32mDone!\033[0m"
