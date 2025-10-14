.PHONY: venv install test run clean

venv:
	python3 -m venv .venv

install: venv
	. .venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt

run:
	. .venv/bin/activate && python -m app

test:
	. .venv/bin/activate && pytest -q

clean:
	rm -rf .venv build dist *.egg-info
