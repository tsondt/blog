---
layout: post
title:  "Bootstrapping my GPG keys - 0x00"
tags: [security, gpg]
comments: true
---

This article describes how I bootstrap my personal GPG keys. Extra security measurements can be taken when using GPG keys for mission-critical purposes such as initializing HashiCorp Vault KMS.

- [Tools](#tools-)
- [A Secure Environment](#a-secure-environment-)
- [Generating GPG Keys](#generating-gpg-keys-)
- [Backup](#backup-)
- [Export](#export-)
- [Extra](#extra-)
- [References](#references-)

# Tools [<span class="icon icon-link"></span>](#tools-)
* GnuPG 2.0.x
* 1 USB key (or CD/DVD) for the OS (preferably a write-protected USB key like [this](http://amzn.to/2vqsHeX))
* 2 USB keys or more for backing up the generated GPG keys
* 1 USB key to transfer the subkeys into day-to-day machines

# A Secure Environment [<span class="icon icon-link"></span>](#a-secure-environment-)
Ideally, the whole key generation process should be performed on a completely offline machine booting a Live CD version of an open-source OS. One of the example documents of this practice can be found [here](https://wiki.debian.org/OpenPGP/CleanRoomLiveEnvironment).

Having said that, however, computer systems are complex. Even if we trust an open-source OS, we can only have limited confidence in the underlying hardware. There are some [attempts](https://puri.sm/products/) at gaining more trust on the assembling process and the firmware. Even then, we still don't have a clear picture of what is underneath. I won't go any further on this topic, but keep that in mind.

Personally, I use CentOS on a "normal" laptop and I think it is good enough in my case. And just to be on the safe side, I disable all the network interfaces and remove the SSD. [Tails](https://tails.boum.org/) is a nice Linux distro for security and privacy but it has some drawbacks: secure boot is not well supported (yet?) and it comes with **modern** (2.1.x) GPG (I'll explain later). CentOS 7 LiveGNOME, however, supports secure boot out-of-the-box and has the right **stable** (2.0.x) GPG.

The first step is [obtaining](https://wiki.centos.org/Download) and [verifying](https://wiki.centos.org/Download/Verify) the CentOS 7 LiveGNOME ISO file, putting it into a (non-writable) bootable media and booting the system. While verifying the ISO file, you will notice that we have a chicken-and-egg problem: we need a trusted machine with GPG installed! That is another problem you have to think of if you plan to generate GPG keys for mission-critical purposes.

# Generating GPG Keys [<span class="icon icon-link"></span>](#generating-gpg-keys-)
In this section, I will show you how to generate a GPG master key and several subkeys. The master key is kept completely offine and is only used to **certify** the subkeys. Each of the subkeys only serves one purpose: **encrypt**, **sign** or **authentication**.

First of all, there are some [changes](https://www.gnupg.org/faq/whats-new-in-2.1.html) and some "features" ([1], [2], [3], [4]) in GnuPG 2.1.x that make it unreliable. As I mentioned above, CentOS 7 LiveGNOME comes with GPG 2.0.x, which is perfect for this task. You can use any open-source OS you like, just make sure that it has GPG 2.0.x installed.

By default, the *String-to-Key* (S2K) [function](https://tools.ietf.org/html/rfc4880#section-3.7) is used to derive a key from the passphrase. That key is used to encrypt your GPG private keys at rest. From the GnuPG man page:
```
--s2k-cipher-algo name
        Use name as the cipher algorithm used to protect secret keys. The defau-
        lt cipher is AES128. This cipher is also used for conventional encrypti-
        on if --personal-cipher-preferences and --cipher-algo is not given.

--s2k-digest-algo name
        Use name as the digest algorithm used to mangle the passphrases. The de-
        fault algorithm is SHA-1.

--s2k-mode n
        Selects how passphrases are mangled. If n is 0 a plain passphrase (whic-
        h is not recommended) will be used, a 1 adds a salt to the passphrase a-
        nd a 3 (the default) iterates the whole process a number of times (see
        --s2k-count). Unless --rfc1991 is used, this mode is also used for conv-
        entional encryption.

--s2k-count n
        Specify how many times the passphrase mangling is repeated. This value
        may range between 1024 and 65011712 inclusive. The default is inquired
        from gpg-agent. Note that not all values in the 1024-65011712 range are
         legal and if an illegal value is selected, GnuPG will round up to the
         nearest legal value. This option is only meaningful if --s2k-mode is 3.
```

The default `s2k-mode` is `3`, which is [Iterated and Salted S2K](https://tools.ietf.org/html/rfc4880#section-3.7.1.3). The default cipher and digest algorithms are `AES128` and `SHA1`, respectively. I prefer to use these values instead:
```
--s2k-cipher-algo AES256 --s2k-digest-algo SHA512 --s2k-count 65011712
```

Additionally, `personal-cipher-preferences` and `personal-digest-preferences` can be changed to `AES256` and `SHA512` (however, it may not be compatible with other software) Those parameters are used when encrypting or signing with your GPG keys.

### Generating the Master Key
Some OSes have both versions of GPG: `gpg` for 1.x and `gpg2` for 2.x. Again, make sure that you use the correct 2.0.x version. Here are the steps to generate a new GPG master key:
1. Open terminal
2. Change `REAL_NAME`, `EMAIL`, `VALID_FOR`, etc. to the correct ones:
{% highlight bash %}
export REAL_NAME="John Doe"
export EMAIL="johndoe@somedomain.com"
export VALID_FOR=3y
export GNUPGHOME="/tmp/gpg"
mkdir -p -m 700 "$(readlink -f "$GNUPGHOME")"
cat >>"$GNUPGHOME/gpg.conf" <<EOF
keyid-format 0xlong
with-fingerprint
personal-cipher-preferences AES256
personal-digest-preferences SHA512
cert-digest-algo SHA512
default-preference-list SHA512 SHA384 SHA256 SHA224 AES256 AES192 AES CAST5 ZLIB BZIP2 ZIP Uncompressed
EOF
gpg2 --quiet --batch --gen-key \
    --personal-cipher-preferences AES256 \
    --personal-digest-preferences SHA512 \
    --cert-digest-algo SHA512 \
    --digest-algo SHA512 \
    --s2k-cipher-algo AES256 \
    --s2k-digest-algo SHA512 \
    --s2k-mode 3 \
    --s2k-count 65011712 <<EOF
%ask-passphrase
Key-Type: RSA
Key-Length: 4096
Key-Usage: sign
Name-Real: $REAL_NAME
Name-Email: $EMAIL
Expire-Date: $VALID_FOR
%commit
EOF
{% endhighlight %}

### Generating the Subkeys
#### Encryption Subkey
{% highlight bash %}
echo addkey$'\n'8$'\n's$'\n'q$'\n'4096$'\n'365$'\n'save$'\n' | \
gpg2 --expert --batch --command-fd 0 --edit-key "$EMAIL"
{% endhighlight %}

#### Signing Subkey
{% highlight bash %}
echo addkey$'\n'8$'\n'e$'\n'q$'\n'4096$'\n'365$'\n'save$'\n' | \
gpg2 --expert --batch --command-fd 0 --edit-key "$EMAIL"
{% endhighlight %}

#### Authentication Subkey
{% highlight bash %}
echo addkey$'\n'8$'\n's$'\n'e$'\n'a$'\n'q$'\n'4096$'\n'365$'\n'save$'\n' | \
gpg2 --expert --batch --command-fd 0 --edit-key "$EMAIL"
{% endhighlight %}

The string after `echo` contains the answers that you would normally input when creating subkeys manually. For example:
```
gpg --expert --edit-key "$EMAIL"
gpg> addkey
Please select what kind of key you want:
   (3) DSA (sign only)
   (4) RSA (sign only)
   (5) Elgamal (encrypt only)
   (6) RSA (encrypt only)
   (7) DSA (set your own capabilities)
   (8) RSA (set your own capabilities)
  (10) ECC (sign only)
  (11) ECC (set your own capabilities)
  (12) ECC (encrypt only)
  (13) Existing key
Your selection? 8

Possible actions for a RSA key: Sign Encrypt Authenticate
Current allowed actions: Sign Encrypt

   (S) Toggle the sign capability
   (E) Toggle the encrypt capability
   (A) Toggle the authenticate capability
   (Q) Finished

Your selection? s

Possible actions for a RSA key: Sign Encrypt Authenticate
Current allowed actions: Encrypt

   (S) Toggle the sign capability
   (E) Toggle the encrypt capability
   (A) Toggle the authenticate capability
   (Q) Finished

Your selection? e

Possible actions for a RSA key: Sign Encrypt Authenticate
Current allowed actions:

   (S) Toggle the sign capability
   (E) Toggle the encrypt capability
   (A) Toggle the authenticate capability
   (Q) Finished

Your selection? a

Possible actions for a RSA key: Sign Encrypt Authenticate
Current allowed actions: Authenticate

   (S) Toggle the sign capability
   (E) Toggle the encrypt capability
   (A) Toggle the authenticate capability
   (Q) Finished

Your selection? q
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (2048) 4096
Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0) 1y
Key expires at Fri 10 Aug 2018 10:32:24 PM EDT
Is this correct? (y/N) y
Really create? (y/N) y
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.

sec  rsa4096/0x608641233323A2E0
     created: 2017-08-11  expires: 2020-08-10  usage: SC
     trust: ultimate      validity: ultimate
ssb  rsa4096/0xB0119B677632552F
     created: 2017-08-11  expires: 2018-08-11  usage: E
ssb  rsa4096/0x0C756A11735E30D9
     created: 2017-08-11  expires: 2018-08-11  usage: S
ssb  rsa4096/0x27D24F72AC456F15
     created: 2017-08-11  expires: 2018-08-11  usage: A
[ultimate] (1). John Doe <johndoe@somedomain.com>
```

# Backup [<span class="icon icon-link"></span>](#backup-)
Plug in one of the backup USB keys and change the current directory to its root. Then generate the revocation certificate:
{% highlight bash %}
echo y$'\n'0$'\n'""$'\n'y$'\n' | \
gpg2 --quiet --gen-revoke --output "$EMAIL-revocation-certificate.asc" --command-fd 0 "$EMAIL"
{% endhighlight %}

You can see what hash algorithm is used by the `--list-packets` flag, `digest algo 10` means `SHA512`:
{% highlight bash %}
gpg2 --list-packets "$EMAIL-revocation-certificate.asc"
...
digest algo 10, begin of digest 3e 09
...
{% endhighlight %}

After that backup your keys:
{% highlight bash %}
gpg2 --quiet --armor --export-secret-keys --output "$EMAIL-keys.asc" "$EMAIL"
{% endhighlight %}

The whole `gpg` folder in `/tmp` should also be copied to the USB key. The same steps should be performed to backup the GPG keys to the remaining USB keys. Those USB keys should be kept completely offline at separate locations.

# Export [<span class="icon icon-link"></span>](#export-)
Plug in the USB used for transferring the subkeys to day-to-day machines and export the subkey:
{% highlight bash %}
gpg2 --quiet --armor --export-secret-subkeys --output "$EMAIL-subkeys.asc" "$EMAIL"
{% endhighlight %}

The subkeys can be imported into the GPG keyring on your day-to-day machines:
{% highlight bash %}
export EMAIL="johndoe@somedomain.com"
gpg2 --quiet --import "$EMAIL-subkeys.asc"
{% endhighlight %}

Listing your freshly generated keys in the GPG keyring:
{% highlight bash %}
gpg2 -K "$EMAIL"
{% endhighlight %}
You'll notice something like `sec#  rsa4096/...`, the `#` means the private key of the master key is not present on the machine.

[1]: https://bugs.gnupg.org/gnupg/issue2220
[2]: https://lists.gnupg.org/pipermail/gnupg-devel/2016-March/030885.html
[3]: https://lists.gnupg.org/pipermail/gnupg-users/2015-July/053885.html
[4]: https://lists.gnupg.org/pipermail/gnupg-users/2015-August/054083.html

# Extra [<span class="icon icon-link"></span>](#extra-)
To change the algorithms of your existing GPG keys, a changing passphrase operation needs to be performed, even if the same old passphrase is re-used:
{% highlight bash %}
export EMAIL="johndoe@somedomain.com"
gpg2 -q \
    --personal-cipher-preferences AES256 \
    --personal-digest-preferences SHA512 \
    --cert-digest-algo SHA512 \
    --digest-algo SHA512 \
    --s2k-cipher-algo AES256 \
    --s2k-digest-algo SHA512 \
    --s2k-mode 3 \
    --s2k-count 65011712 --edit-key "$EMAIL" passwd save quit
{% endhighlight %}

To find out which algorithms are currently used to protect your GPG keys (won't work with "modern" (2.1.x) GPG):
{% highlight bash %}
$ gpg2 --list-packets "$HOME/.gnupg/secring.gpg"
...
        iter+salt S2K, algo: 9, SHA1 protection, hash: 10, salt: 96c4e5d934011e59
        protect count: 65011712 (255)
...
{% endhighlight %}
From [RFC4880](https://tools.ietf.org/html/rfc4880#section-9.2), `algo: 9` means `AES256` and `hash: 10` means `SHA512`.

# References [<span class="icon icon-link"></span>](#references-)

## PGP
* <https://alexcabal.com/creating-the-perfect-gpg-keypair/>
* <https://pthree.org/2015/11/19/your-gnupg-private-key/>
* <https://riseup.net/en/security/message-security/openpgp/best-practices>
* <https://wiki.debian.org/Subkeys>
* <https://help.ubuntu.com/community/GnuPrivacyGuardHowto>
* <https://fedoraproject.org/wiki/Creating_GPG_Keys>
* <https://tools.ietf.org/html/rfc4880>
* <https://www.tylerburton.ca/2015/04/increasing-the-protection-of-your-stored-pgp-key/>
* <https://wiki.ubuntu.com/SecurityTeam/GPGMigration>
* <https://debian-administration.org/users/dkg/weblog/48>
* <https://davesteele.github.io/gpg/2014/09/20/anatomy-of-a-gpg-key/>
* <http://www.openpgp-schulungen.de/scripte/keygeneration/key-generation.sh>
* <https://spin.atomicobject.com/2013/10/23/secure-gpg-keys/>
* <https://spin.atomicobject.com/2013/11/24/secure-gpg-keys-guide/>

## Other
* <https://blog.josefsson.org/2016/11/03/why-i-dont-use-2048-or-4096-rsa-key-sizes/>
* <https://www.yubico.com/2015/02/big-debate-2048-4096-yubicos-stand/>
* <https://blog.filippo.io/on-keybase-dot-io-and-encrypted-private-key-sharing/>
* <https://blog.filippo.io/giving-up-on-long-term-pgp/>
* <http://www.issihosts.com/haveged/>
* <https://wiki.debian.org/OpenPGP/CleanRoomLiveEnvironment>
* <https://dev.guardianproject.info/projects/psst/wiki/CleanRoom>
* <https://gist.github.com/abeluck/3383449>
