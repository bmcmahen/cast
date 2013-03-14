DIR = test/expected

expected: clean expected-dev expected-prod standalone

expected-dev:
	@component build -o $(DIR) -n build-dev --dev

expected-prod:
	@component build -o $(DIR) -n build-prod

standalone:
	@component build -o $(DIR) -n standalone -s $$

clean:
	rm -fr $(DIR)

.PHONY: expected