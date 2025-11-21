rule dummy {
    strings:
        $a = "dummy"
    condition:
        $a
}
