## Parameters

### {WEIGHT}

`heavyweight`
`bridgerweight`
`cruiserweight`
`light-heavyweight`
`super-middleweight`
`middleweight`
`super-welterweight`
`welterweight`
`super-lightweight`
`lightweight`
`super-featherweight`
`featherweight`
`super-bantamweight`
`bantamweight`
`super-flyweight`
`flyweight`
`light-flyweight`
`minimumweight`

### {ORG}

`ibu`
`nysac`
`wba`
`wbar`
`wbas`
`wbc`
`ibf`
`wbo`
`ring`

---

## Bouts

Each bout endpoint returns an array of Bout objects.

`https://openboxing.org/api/bouts/all.json`

`https://openboxing.org/api/bouts/{WEIGHT}.json`

`https://openboxing.org/api/bouts/{WEIGHT}/{ORG}.json`

`https://openboxing.org/api/bouts/scheduled.json`

Bout object example

```json
{
  "boutId":1247,
  "date":"1974-10-30",
  "boxers":{
    "boxerA":{
      "championId":313,
      "name":{
        "first":"George",
        "last":"Foreman",
        "short":"Foreman"
      },
      "born":"1949-01-10"
    },
    "boxerB":{
      "championId":252,
      "name":{
        "first":"Muhammad",
        "last":"Ali",
        "short":"Ali"
      },
      "born":"1942-01-17"
    }
  },
  "status":"FINISHED",
  "result":{
    "winner":"BOXER B",
    "methodOfVictory":"KO",
    "totalRounds":8
  },
  "scheduledRounds":15,
  "weight":{
    "class":"Heavyweight",
    "lb":"175+"
  },
  "titles":[
    {
      "weight":{
        "class":"Heavyweight",
        "lb":"200+"
      },
      "org":{
        "name":{
          "full":"World Boxing Association",
          "short":"WBA",
          "abbreviation":"WBA"
        }
      },
      "active":false
    },
    {
      "weight":{
        "class":"Heavyweight",
        "lb":"200+"
      },
      "org":{
        "name":{
          "full":"World Boxing Council",
          "short":"WBC",
          "abbreviation":"WBC"
        }
      },
      "active":true
    },
    {
      "weight":{
        "class":"Heavyweight",
        "lb":"200+"
      },
      "org":{
        "name":{
          "full":"The Ring",
          "short":"The Ring",
          "abbreviation":"RING"
        }
      },
      "active":true
    }
  ],
  "location":{
    "locationId":null,
    "venue":null,
    "locality":null,
    "country":null,
    "latitude":null,
    "longitude":null
  }
}
```

---

## Reigns

Each reign endpoint returns an array of Reign objects.

`https://openboxing.org/api/reigns/all.json`

`https://openboxing.org/api/reigns/{WEIGHT}.json`

`https://openboxing.org/api/reigns/{WEIGHT}/{ORG}.json`

Reign object example

```json
{
  "reign_id":1670,
  "period":{
    "begins":"1995-04-29",
    "ends":"2005-07-16",
    "current":false
  },
  "champion":{
    "championId":652,
    "name":{
      "first":"Bernard",
      "last":"Hopkins",
      "short":"Hopkins"
    },
    "born":"1965-01-15"
  },
  "title":{
    "weight":{
      "class":"Middleweight",
      "lb":"160"
    },
    "org":{
      "name":{
        "full":"International Boxing Federation",
        "short":"IBF",
        "abbreviation":"IBF"
      }
    },
    "active":true
  }
}
```

---

## Champions

Return a list of champions.

`https://openboxing.org/api/champions/all.json`

Return a champion object with an array of bouts and an array of reigns.

`https://openboxing.org/api/champions/{ID}.json`

Champion object example

```json
{
  "champion":{
    "championId":170,
    "name":{
      "first":"Sugar",
      "last":"Ray Robinson",
      "short":"Robinson"
    },
    "born":"1921-05-03"
  },
  "reigns":[...],
  "bouts":[...]
}
```