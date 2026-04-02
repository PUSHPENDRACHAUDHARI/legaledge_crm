from django.test import Client, TestCase, override_settings


@override_settings(ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"])
class PublicApiRootTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_api_root_is_public(self):
        response = self.client.get("/api/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("contacts", response.json())

    def test_crm_endpoint_still_requires_authentication(self):
        response = self.client.get("/api/contacts/")

        self.assertEqual(response.status_code, 401)
