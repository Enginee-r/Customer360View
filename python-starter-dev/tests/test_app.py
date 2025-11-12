from app import main


def test_main_prints(capsys):
    main()
    captured = capsys.readouterr()
    assert "Hello, world" in captured.out
